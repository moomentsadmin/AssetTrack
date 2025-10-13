import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Loader2, Edit, Trash2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Location, Asset } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertLocationSchema } from "@shared/schema";
import { z } from "zod";

type FormData = z.infer<typeof insertLocationSchema>;

export default function LocationsPage() {
  const { toast } = useToast();
  const [dialogState, setDialogState] = useState<{
    type: "create" | "edit" | null;
    location?: Location;
  }>({ type: null });

  const { data: locations = [], isLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(insertLocationSchema),
    defaultValues: {
      name: dialogState.location?.name || "",
      description: dialogState.location?.description || "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (dialogState.location) {
        const res = await apiRequest("PATCH", `/api/locations/${dialogState.location.id}`, data);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/locations", data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({ title: dialogState.location ? "Location updated" : "Location created" });
      setDialogState({ type: null });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save location",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/locations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({ title: "Location deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete location",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="h-8 w-8" />
            Locations
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage physical locations where assets are stored
          </p>
        </div>
        <Button onClick={() => {
          setDialogState({ type: "create" });
          form.reset({ name: "", description: "" });
        }} data-testid="button-add-location">
          <Plus className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {locations.map((location) => {
          const locationAssets = assets.filter((a) => a.locationId === location.id);
          const totalValue = locationAssets.reduce((sum, a) => sum + Number(a.currentValue || a.purchaseCost || 0), 0);

          return (
            <Card key={location.id} className="p-6" data-testid={`card-location-${location.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold text-lg">{location.name}</h3>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setDialogState({ type: "edit", location });
                      form.reset({ name: location.name, description: location.description || "" });
                    }}
                    data-testid={`button-edit-${location.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteMutation.mutate(location.id)}
                    data-testid={`button-delete-${location.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {location.description && (
                <p className="text-sm text-muted-foreground mb-4">{location.description}</p>
              )}
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Assets:</span>
                  <span className="font-medium">{locationAssets.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Value:</span>
                  <span className="font-medium">${totalValue.toLocaleString()}</span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {locations.length === 0 && (
        <Card className="p-12">
          <p className="text-center text-muted-foreground">No locations found. Create your first location.</p>
        </Card>
      )}

      <Dialog open={dialogState.type !== null} onOpenChange={(open) => !open && setDialogState({ type: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogState.type === "create" ? "Add Location" : "Edit Location"}</DialogTitle>
            <DialogDescription>
              {dialogState.type === "create" ? "Create a new location" : "Update location information"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., HQ Building, Warehouse A" data-testid="input-location-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} value={field.value || ""} placeholder="Location details..." data-testid="input-location-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogState({ type: null })}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-location">
                  {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {dialogState.type === "create" ? "Create" : "Save"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
