import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertAssetSchema, Asset, Department } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const formSchema = insertAssetSchema.extend({
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function AssetForm({ asset, onSuccess }: { asset?: Asset; onSuccess: () => void }) {
  const { toast } = useToast();

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: customFields = [] } = useQuery<any[]>({
    queryKey: ["/api/custom-fields"],
  });

  const assetTypeCustomFields = customFields.filter(
    (field) => field.assetType === (asset?.assetType || form.watch("assetType"))
  );

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: asset?.name || "",
      assetType: asset?.assetType || "hardware",
      status: asset?.status || "available",
      serialNumber: asset?.serialNumber || "",
      model: asset?.model || "",
      manufacturer: asset?.manufacturer || "",
      purchaseDate: asset?.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : "",
      purchaseCost: asset?.purchaseCost || "",
      warrantyExpiry: asset?.warrantyExpiry ? new Date(asset.warrantyExpiry).toISOString().split('T')[0] : "",
      condition: asset?.condition || "",
      location: asset?.location || "",
      departmentId: asset?.departmentId || "",
      depreciationMethod: asset?.depreciationMethod || null,
      depreciationRate: asset?.depreciationRate || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate).toISOString() : null,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry).toISOString() : null,
        departmentId: data.departmentId || null,
        depreciationMethod: data.depreciationMethod || null,
        depreciationRate: data.depreciationRate || null,
      };

      if (asset) {
        const res = await apiRequest("PATCH", `/api/assets/${asset.id}`, payload);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/assets", payload);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({ title: asset ? "Asset updated" : "Asset created" });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save asset",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Name</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-asset-name" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="assetType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-asset-type">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="hardware">Hardware</SelectItem>
                    <SelectItem value="software">Software</SelectItem>
                    <SelectItem value="license">License</SelectItem>
                    <SelectItem value="accessory">Accessory</SelectItem>
                    <SelectItem value="office_equipment">Office Equipment</SelectItem>
                    <SelectItem value="vehicle">Vehicle</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-asset-status">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_maintenance">In Maintenance</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="disposed">Disposed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="serialNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Serial Number</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} className="font-mono" data-testid="input-serial" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="manufacturer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manufacturer</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} data-testid="input-manufacturer" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Model</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} data-testid="input-model" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="purchaseDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value || ""} data-testid="input-purchase-date" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="purchaseCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Purchase Cost</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} value={field.value || ""} data-testid="input-cost" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="warrantyExpiry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Warranty Expiry</FormLabel>
                <FormControl>
                  <Input type="date" {...field} value={field.value || ""} data-testid="input-warranty" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="departmentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Department</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger data-testid="select-department">
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} data-testid="input-location" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="condition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Condition</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} placeholder="e.g., Excellent, Good, Fair" data-testid="input-condition" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {assetTypeCustomFields.length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="font-medium mb-4">Custom Fields</h3>
            <div className="grid grid-cols-2 gap-4">
              {assetTypeCustomFields.map((field) => (
                <div key={field.id}>
                  <Label>{field.fieldName}{field.isRequired && " *"}</Label>
                  <Input
                    type={field.fieldType === "number" ? "number" : field.fieldType === "date" ? "date" : "text"}
                    placeholder={`Enter ${field.fieldName.toLowerCase()}`}
                    data-testid={`input-custom-${field.id}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onSuccess} data-testid="button-cancel">
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending} data-testid="button-save-asset">
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {asset ? "Update Asset" : "Create Asset"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
