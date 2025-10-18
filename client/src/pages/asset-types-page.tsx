import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Loader2, Edit, Trash2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AssetType, Asset } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertAssetTypeSchema } from "@shared/schema";
import { z } from "zod";

type FormData = z.infer<typeof insertAssetTypeSchema>;

export default function AssetTypesPage() {
  const { toast } = useToast();
  const [dialogState, setDialogState] = useState<{
    type: "create" | "edit" | null;
    assetType?: AssetType;
  }>({ type: null });

  const { data: assetTypes = [], isLoading } = useQuery<AssetType[]>({
    queryKey: ["/api/asset-types"],
  });

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(insertAssetTypeSchema),
    defaultValues: {
      name: dialogState.assetType?.name || "",
      description: dialogState.assetType?.description || "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (dialogState.assetType) {
        const res = await apiRequest("PATCH", `/api/asset-types/${dialogState.assetType.id}`, data);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/asset-types", data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-types"] });
      toast({ title: dialogState.assetType ? "Asset type updated" : "Asset type created" });
      setDialogState({ type: null });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save asset type",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/asset-types/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/asset-types"] });
      toast({ title: "Asset type deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete asset type",
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
            <Tag className="h-8 w-8" />
            Asset Types
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage asset type categories for better organization
          </p>
        </div>
        <Button onClick={() => {
          setDialogState({ type: "create" });
          form.reset({ name: "", description: "" });
        }} data-testid="button-add-asset-type">
          <Plus className="mr-2 h-4 w-4" />
          Add Asset Type
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assetTypes.map((assetType) => {
          const typeAssets = assets.filter((a) => a.assetTypeId === assetType.id);
          const totalValue = typeAssets.reduce((sum, a) => sum + Number(a.currentValue || a.purchaseCost || 0), 0);

          return (
            <Card key={assetType.id} className="p-6" data-testid={`card-asset-type-${assetType.id}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold text-lg">{assetType.name}</h3>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setDialogState({ type: "edit", assetType });
                      form.reset({ name: assetType.name, description: assetType.description || "" });
                    }}
                    data-testid={`button-edit-${assetType.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteMutation.mutate(assetType.id)}
                    data-testid={`button-delete-${assetType.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {assetType.description && (
                <p className="text-sm text-muted-foreground mb-4">{assetType.description}</p>
              )}
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Assets:</span>
                  <span className="font-medium">{typeAssets.length}</span>
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

      {assetTypes.length === 0 && (
        <Card className="p-12">
          <p className="text-center text-muted-foreground">No asset types found. Create your first asset type.</p>
        </Card>
      )}

      <Dialog open={dialogState.type !== null} onOpenChange={(open) => !open && setDialogState({ type: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogState.type === "create" ? "Add Asset Type" : "Edit Asset Type"}</DialogTitle>
            <DialogDescription>
              {dialogState.type === "create" ? "Create a new asset type" : "Update asset type information"}
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
                      <Input {...field} placeholder="e.g., Hardware, Software, License" data-testid="input-asset-type-name" />
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
                      <Textarea {...field} value={field.value || ""} placeholder="Asset type details..." data-testid="input-asset-type-description" />
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
                <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-asset-type">
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
