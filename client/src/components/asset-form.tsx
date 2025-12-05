import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { insertAssetSchema, Asset, Department, Location, AssetType } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const formSchema = insertAssetSchema.extend({
  purchaseDate: z.string().optional(),
  warrantyExpiry: z.string().optional(),
  laptopAssignedDate: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function AssetForm({ asset, onSuccess }: { asset?: Asset; onSuccess: () => void }) {
  const { toast } = useToast();

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: locations = [] } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: assetTypes = [] } = useQuery<AssetType[]>({
    queryKey: ["/api/asset-types"],
  });

  const { data: customFields = [] } = useQuery<any[]>({
    queryKey: ["/api/custom-fields"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: asset?.name || "",
      assetTypeId: asset?.assetTypeId || "",
      status: asset?.status || "available",
      serialNumber: asset?.serialNumber || "",
      model: asset?.model || "",
      manufacturer: asset?.manufacturer || "",
      purchaseDate: asset?.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : "",
      purchaseCost: asset?.purchaseCost || "",
      warrantyExpiry: asset?.warrantyExpiry ? new Date(asset.warrantyExpiry).toISOString().split('T')[0] : "",
      condition: asset?.condition || "",
      photoUrl: asset?.photoUrl || "",
      locationId: asset?.locationId || "",
      departmentId: asset?.departmentId || "",
      depreciationMethod: asset?.depreciationMethod || null,
      depreciationRate: asset?.depreciationRate || "",
      assetTag: asset?.assetTag || "",
      priority: asset?.priority || "",
      employeeId: asset?.employeeId || "",
      companyClient: asset?.companyClient || "",
      mobileNumber: asset?.mobileNumber || "",
      internalMailId: asset?.internalMailId || "",
      clientMailId: asset?.clientMailId || "",
      expressServiceCode: asset?.expressServiceCode || "",
      adapterSn: asset?.adapterSn || "",
      processor: asset?.processor || "",
      ram: asset?.ram || "",
      storage: asset?.storage || "",
      laptopAssignedDate: asset?.laptopAssignedDate ? new Date(asset.laptopAssignedDate).toISOString().split('T')[0] : "",
      license: asset?.license || "",
      acknowledgementForm: asset?.acknowledgementForm || "",
      oldLaptop: asset?.oldLaptop || "",
      supplierName: asset?.supplierName || "",
      invoiceNo: asset?.invoiceNo || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        ...data,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate).toISOString() : null,
        warrantyExpiry: data.warrantyExpiry ? new Date(data.warrantyExpiry).toISOString() : null,
        laptopAssignedDate: data.laptopAssignedDate ? new Date(data.laptopAssignedDate).toISOString() : null,
        locationId: data.locationId || null,
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

  const selectedAssetTypeId = form.watch("assetTypeId");
  const selectedAssetType = assetTypes.find((at) => at.id === selectedAssetTypeId);
  const assetTypeCustomFields = customFields.filter(
    (field) => field.assetType === selectedAssetType?.name.toLowerCase()
  );
  
  const selectedLocationId = form.watch("locationId");
  const selectedLocation = locations.find((loc) => loc.id === selectedLocationId);

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
            name="assetTypeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-asset-type">
                      <SelectValue placeholder="Select asset type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {assetTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
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
                <FormLabel>Purchase Cost {selectedLocation && `(${selectedLocation.currency || "USD"})`}</FormLabel>
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
            name="locationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger data-testid="select-location">
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

        <FormField
          control={form.control}
          name="photoUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Photo URL (Optional)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value || ""} type="url" placeholder="https://example.com/asset-photo.jpg" data-testid="input-photo-url" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-4">Additional Asset Information</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="assetTag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset Tag</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="e.g., AT-001" data-testid="input-asset-tag" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="e.g., High, Medium, Low" data-testid="input-priority" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee ID</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-employee-id" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyClient"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company/Client</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-company-client" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="mobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mobile Number</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} type="tel" data-testid="input-mobile-number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="internalMailId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Internal Mail ID</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} type="email" data-testid="input-internal-mail-id" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="clientMailId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Mail ID</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} type="email" data-testid="input-client-mail-id" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expressServiceCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Express Service Code</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-express-service-code" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="adapterSn"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adapter SN</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-adapter-sn" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="processor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Processor</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-processor" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="ram"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RAM</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="e.g., 16GB" data-testid="input-ram" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="storage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Storage</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="e.g., 512GB SSD" data-testid="input-storage" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="laptopAssignedDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Laptop Assigned Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ""} data-testid="input-laptop-assigned-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="license"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>License</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-license" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="acknowledgementForm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Acknowledgement Form</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-acknowledgement-form" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="oldLaptop"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Old Laptop</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-old-laptop" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="supplierName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Supplier Name</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-supplier-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="invoiceNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Invoice No</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} data-testid="input-invoice-no" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
