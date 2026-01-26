import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, Download, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ImportPage() {
  console.log("ImportPage component mounted");

  const { user, isLoading } = useAuth();
  console.log("Auth status - user:", user, "isLoading:", isLoading);

  const { toast } = useToast();
  console.log("useToast hook initialized");

  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  console.log("State initialized, file:", file, "importResult:", importResult);

  // Check authentication first
  if (isLoading) {
    console.log("Auth is loading, showing loading state");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("No user found, should redirect but showing message for debugging");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Not Authenticated</h1>
          <p className="text-muted-foreground">Please log in to access the import page.</p>
          <p className="text-sm text-muted-foreground">If you are logged in, try refreshing the page.</p>
        </div>
      </div>
    );
  }

  console.log("User authenticated, proceeding with import page");

  console.log("User authenticated, proceeding with import page");

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log("Starting import mutation with file:", file);
      try {
        const formData = new FormData();
        formData.append("file", file);
        console.log("Sending import request with file:", file.name, "size:", file.size);
        const res = await fetch("/api/import/assets", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        console.log("Response status:", res.status, "headers:", Object.fromEntries(res.headers.entries()));
        if (!res.ok) {
          const errorText = await res.text();
          console.error("Import failed with status", res.status, ":", errorText);
          throw new Error(errorText || `HTTP ${res.status}`);
        }
        const data = await res.json();
        console.log("Import response data:", data);
        return data;
      } catch (error) {
        console.error("Error in mutationFn:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Import mutation success:", data);
      try {
        // Validate response data
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid response data');
        }

        const success = typeof data.success === 'number' ? data.success : 0;
        const failed = typeof data.failed === 'number' ? data.failed : 0;
        const errors = Array.isArray(data.errors) ? data.errors.filter((e: any) => typeof e === 'string') : [];

        queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
        setImportResult({ success, failed, errors });
        setFile(null);
        toast({ title: "Import completed" });
      } catch (error) {
        console.error("Error in onSuccess:", error);
        toast({
          title: "Import completed with warnings",
          description: "Import may have completed but response data was malformed",
          variant: "destructive",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Import mutation error:", error);
      try {
        toast({
          title: "Import failed",
          description: error.message,
          variant: "destructive",
        });
      } catch (toastError) {
        console.error("Error showing toast:", toastError);
      }
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setImportResult(null);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `name,assetType,serialNumber,model,manufacturer,purchaseDate,purchaseCost,warrantyExpiry,condition,location,status
Laptop Dell XPS,hardware,SN123456,XPS 15,Dell,2024-01-15,1299.99,2027-01-15,Excellent,Office A,available
Microsoft Office License,license,LIC-789,Office 365,Microsoft,2024-02-01,149.99,2025-02-01,New,Cloud,available`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "asset_import_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl" data-testid="import-page">
      <div>
        <h1 className="text-3xl font-bold tracking-tight" data-testid="import-title">Import Assets</h1>
        <p className="text-muted-foreground mt-2">
          Bulk import assets from CSV or Excel files
        </p>
      </div>

      <Card data-testid="card-download-template">
        <CardHeader>
          <CardTitle>Download Template</CardTitle>
          <CardDescription>
            Start with our CSV template to ensure proper formatting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            variant="outline" 
            onClick={downloadTemplate} 
            data-testid="button-download-template"
          >
            <Download className="mr-2 h-4 w-4" />
            Download CSV Template
          </Button>
        </CardContent>
      </Card>

      <Card data-testid="card-upload-file">
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>
            Upload a CSV or Excel file with your asset data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center" data-testid="upload-area">
            <FileUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {file ? file.name : "Choose a CSV or Excel file"}
              </p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                data-testid="input-file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="secondary" asChild>
                  <span>Select File</span>
                </Button>
              </label>
            </div>
          </div>

          {file && (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileUp className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                onClick={() => importMutation.mutate(file)}
                disabled={importMutation.isPending}
                data-testid="button-import"
              >
                {importMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Import
              </Button>
            </div>
          )}

          {importResult && importResult.success !== undefined && importResult.failed !== undefined && (
            <Alert>
              <div className="flex items-start gap-3">
                {importResult.failed === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-chart-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-destructive" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <p className="font-medium mb-2">
                      Successfully imported {importResult.success || 0} assets
                      {importResult.failed > 0 && `, ${importResult.failed} failed`}
                    </p>
                    {importResult.errors && Array.isArray(importResult.errors) && importResult.errors.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Errors:</p>
                        <ul className="text-sm space-y-1">
                          {importResult.errors.slice(0, 5).map((error, i) => (
                            <li key={i} className="text-destructive">• {typeof error === 'string' ? error : 'Unknown error'}</li>
                          ))}
                          {importResult.errors.length > 5 && (
                            <li className="text-muted-foreground">
                              ... and {importResult.errors.length - 5} more errors
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="grid gap-2">
            <p>• Required fields: <span className="font-medium text-foreground">name, assetType</span></p>
            <p>• Valid asset types: hardware, software, license, accessory, office_equipment, vehicle</p>
            <p>• Valid status values: available, assigned, in_maintenance, retired, lost, disposed</p>
            <p>• Date format: YYYY-MM-DD (e.g., 2024-01-15)</p>
            <p>• Cost format: numeric values without currency symbols (e.g., 1299.99)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
