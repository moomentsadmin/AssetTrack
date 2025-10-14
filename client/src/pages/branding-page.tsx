import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Loader2, Building2, Globe, Image as ImageIcon, Link as LinkIcon } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SystemSettings } from "@shared/schema";

const brandingSchema = z.object({
  companyName: z.string().optional(),
  companyWebsite: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  companyLogo: z.string().optional(),
  headerText: z.string().optional(),
  footerText: z.string().optional(),
  defaultCurrency: z.string().default("USD"),
});

type BrandingFormData = z.infer<typeof brandingSchema>;

export default function BrandingPage() {
  const { toast } = useToast();
  
  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ["/api/settings/system"],
  });

  const form = useForm<BrandingFormData>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      companyName: "",
      companyWebsite: "",
      companyLogo: "",
      headerText: "",
      footerText: "",
      defaultCurrency: "USD",
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings && !form.formState.isDirty) {
      form.reset({
        companyName: settings.companyName || "",
        companyWebsite: settings.companyWebsite || "",
        companyLogo: settings.companyLogo || "",
        headerText: settings.headerText || "",
        footerText: settings.footerText || "",
        defaultCurrency: settings.defaultCurrency || "USD",
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: BrandingFormData) => {
      const res = await apiRequest("POST", "/api/settings/system", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/system"] });
      toast({ title: "Branding settings saved successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to save branding settings",
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Building2 className="h-8 w-8" />
          Company Branding
        </h1>
        <p className="text-muted-foreground mt-2">
          Customize your organization's branding and appearance
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((data) => saveMutation.mutate(data))} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Basic company details displayed across the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="e.g., Acme Corporation" data-testid="input-company-name" />
                    </FormControl>
                    <FormDescription>
                      This will be displayed in the application header and footer
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyWebsite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Website</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <Input {...field} value={field.value || ""} type="url" placeholder="https://example.com" data-testid="input-company-website" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Link to your company's main website
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Company Logo</CardTitle>
              <CardDescription>Upload your company logo (URL)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="companyLogo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        <Input {...field} value={field.value || ""} type="url" placeholder="https://example.com/logo.png" data-testid="input-company-logo" />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Direct URL to your company logo image. For best results, use a transparent PNG.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("companyLogo") && (
                <div className="pt-4 border-t">
                  <Label className="text-sm text-muted-foreground mb-2 block">Logo Preview</Label>
                  <div className="bg-muted p-4 rounded-lg flex items-center justify-center">
                    <img
                      src={form.watch("companyLogo") || ""}
                      alt="Company logo preview"
                      className="max-h-24 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Header & Footer</CardTitle>
              <CardDescription>Customize header and footer text displayed on login page</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="headerText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Header Text</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Welcome to our Asset Management System" data-testid="input-header-text" />
                    </FormControl>
                    <FormDescription>
                      Custom text to display in the header (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="footerText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Footer Text</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="© 2024 Company Name. All rights reserved." data-testid="input-footer-text" />
                    </FormControl>
                    <FormDescription>
                      Custom text to display in the footer (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Regional Settings</CardTitle>
              <CardDescription>Currency and localization preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="defaultCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Currency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-currency">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                        <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                        <SelectItem value="JPY">JPY - Japanese Yen (¥)</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar (C$)</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar (A$)</SelectItem>
                        <SelectItem value="INR">INR - Indian Rupee (₹)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      This currency will be used for displaying asset values across the application
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending} data-testid="button-save-branding">
              {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => form.reset()}
              data-testid="button-reset-branding"
            >
              Reset
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
