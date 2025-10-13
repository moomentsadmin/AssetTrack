import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Loader2, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Department, Asset } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDepartmentSchema } from "@shared/schema";
import { z } from "zod";

type FormData = z.infer<typeof insertDepartmentSchema>;

export default function DepartmentsPage() {
  const { toast } = useToast();
  const [dialogState, setDialogState] = useState<{
    type: "create" | "edit" | null;
    department?: Department;
  }>({ type: null });

  const { data: departments = [], isLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(insertDepartmentSchema),
    defaultValues: {
      name: dialogState.department?.name || "",
      description: dialogState.department?.description || "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (dialogState.department) {
        const res = await apiRequest("PATCH", `/api/departments/${dialogState.department.id}`, data);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/departments", data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: dialogState.department ? "Department updated" : "Department created" });
      setDialogState({ type: null });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save department",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/departments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/departments"] });
      toast({ title: "Department deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete department",
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
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground mt-2">
            Manage organizational departments and their assets
          </p>
        </div>
        <Button onClick={() => {
          setDialogState({ type: "create" });
          form.reset({ name: "", description: "" });
        }} data-testid="button-add-department">
          <Plus className="mr-2 h-4 w-4" />
          Add Department
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((dept) => {
          const deptAssets = assets.filter((a) => a.departmentId === dept.id);
          const totalValue = deptAssets.reduce((sum, a) => sum + Number(a.currentValue || a.purchaseCost || 0), 0);

          return (
            <Card key={dept.id} className="p-6" data-testid={`card-department-${dept.id}`}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-lg">{dept.name}</h3>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setDialogState({ type: "edit", department: dept });
                      form.reset({ name: dept.name, description: dept.description || "" });
                    }}
                    data-testid={`button-edit-${dept.id}`}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    onClick={() => deleteMutation.mutate(dept.id)}
                    data-testid={`button-delete-${dept.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {dept.description && (
                <p className="text-sm text-muted-foreground mb-4">{dept.description}</p>
              )}
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total Assets:</span>
                  <span className="font-medium">{deptAssets.length}</span>
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

      {departments.length === 0 && (
        <Card className="p-12">
          <p className="text-center text-muted-foreground">No departments found. Create your first department.</p>
        </Card>
      )}

      <Dialog open={dialogState.type !== null} onOpenChange={(open) => !open && setDialogState({ type: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogState.type === "create" ? "Add Department" : "Edit Department"}</DialogTitle>
            <DialogDescription>
              {dialogState.type === "create" ? "Create a new department" : "Update department information"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-department-name" />
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
                      <Textarea {...field} value={field.value || ""} data-testid="textarea-department-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogState({ type: null })}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-department">
                  {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {dialogState.type === "create" ? "Create" : "Update"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
