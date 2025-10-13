import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUp, Download, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ImportPage() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import/assets", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      setImportResult(data);
      setFile(null);
      toast({ title: "Import completed" });
    },
    onError: (error: Error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
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
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Import Assets</h1>
        <p className="text-muted-foreground mt-2">
          Bulk import assets from CSV or Excel files
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Download Template</CardTitle>
          <CardDescription>
            Start with our CSV template to ensure proper formatting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={downloadTemplate} data-testid="button-download-template">
            <Download className="mr-2 h-4 w-4" />
            Download CSV Template
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload File</CardTitle>
          <CardDescription>
            Upload a CSV or Excel file with your asset data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
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

          {importResult && (
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
                      Successfully imported {importResult.success} assets
                      {importResult.failed > 0 && `, ${importResult.failed} failed`}
                    </p>
                    {importResult.errors.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium">Errors:</p>
                        <ul className="text-sm space-y-1">
                          {importResult.errors.slice(0, 5).map((error, i) => (
                            <li key={i} className="text-destructive">• {error}</li>
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
