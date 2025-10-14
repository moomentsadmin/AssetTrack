import { useQuery, useMutation } from "@tanstack/react-query";
import { User, AssetAssignment, Asset, insertUserSchema } from "@shared/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Mail, Building2, Package, Plus, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

const userFormSchema = insertUserSchema.extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type UserFormData = z.infer<typeof userFormSchema>;

export default function EmployeesPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: assignments = [] } = useQuery<AssetAssignment[]>({
    queryKey: ["/api/assignments"],
  });

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      fullName: "",
      role: "employee",
      department: "",
      isContractor: false,
      password: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      const res = await apiRequest("POST", "/api/users", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Employee added successfully" });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add employee",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/import/users", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ 
        title: "Bulk upload completed", 
        description: `${data.success} employees added, ${data.failed} failed` 
      });
      setIsBulkUploadOpen(false);
      setUploadFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Bulk upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const canManageEmployees = currentUser?.role === "admin" || currentUser?.role === "manager";

  const filteredUsers = users.filter((user) =>
    user.fullName.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.department?.toLowerCase().includes(search.toLowerCase())
  );

  if (usersLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const downloadTemplate = () => {
    const csvContent = `fullName,email,username,password,role,department,isContractor
John Doe,john@example.com,johndoe,password123,employee,Engineering,false
Jane Smith,jane@example.com,janesmith,password456,manager,HR,false`;
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "employee_import_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees & Contractors</h1>
          <p className="text-muted-foreground mt-2">
            Manage team members and their assigned assets
          </p>
        </div>
        {canManageEmployees && (
          <div className="flex gap-2">
            <Button onClick={() => setIsBulkUploadOpen(true)} variant="outline" data-testid="button-bulk-upload">
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
            <Button onClick={() => setIsAddDialogOpen(true)} data-testid="button-add-employee">
              <Plus className="h-4 w-4 mr-2" />
              Add Employee
            </Button>
          </div>
        )}
      </div>

      <Card className="p-4">
        <Input
          placeholder="Search by name, email, or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-employees"
        />
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredUsers.map((user) => {
          const userAssignments = assignments.filter(
            (a) => a.userId === user.id && !a.returnedAt
          );
          const assignedAssets = userAssignments.map((a) =>
            assets.find((asset) => asset.id === a.assetId)
          ).filter(Boolean);

          return (
            <Card key={user.id} className="p-6" data-testid={`card-employee-${user.id}`}>
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {user.fullName.split(" ").map(n => n[0]).join("").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{user.fullName}</h3>
                    {user.isContractor && (
                      <Badge variant="secondary" className="text-xs">Contractor</Badge>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{user.email}</span>
                    </div>
                    {user.department && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="h-3 w-3" />
                        <span className="truncate">{user.department}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Assets:</span>
                        <span className="font-medium">{assignedAssets.length}</span>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {user.role}
                      </Badge>
                    </div>
                    {assignedAssets.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {assignedAssets.slice(0, 3).map((asset) => (
                          <p key={asset?.id} className="text-xs text-muted-foreground truncate">
                            • {asset?.name}
                          </p>
                        ))}
                        {assignedAssets.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            +{assignedAssets.length - 3} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredUsers.length === 0 && (
        <Card className="p-12">
          <p className="text-center text-muted-foreground">No employees found</p>
        </Card>
      )}

      {/* Add Employee Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Employee</DialogTitle>
            <DialogDescription>Create a new employee or contractor account</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-fullname" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" data-testid="input-email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-username" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" data-testid="input-password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        {currentUser?.role === "admin" && <SelectItem value="admin">Admin</SelectItem>}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} data-testid="input-department" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isContractor"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-contractor"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0">Is Contractor</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-employee">
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Employee
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Dialog */}
      <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Upload Employees</DialogTitle>
            <DialogDescription>Upload a CSV file to add multiple employees at once</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Download Template</CardTitle>
                <CardDescription>Start with our CSV template for proper formatting</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={downloadTemplate} variant="outline" data-testid="button-download-template">
                  Download CSV Template
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Upload File</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  data-testid="input-upload-file"
                />
                <div className="flex gap-2">
                  <Button 
                    onClick={() => uploadFile && bulkUploadMutation.mutate(uploadFile)} 
                    disabled={!uploadFile || bulkUploadMutation.isPending}
                    data-testid="button-upload"
                  >
                    {bulkUploadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Upload
                  </Button>
                  <Button variant="outline" onClick={() => { setIsBulkUploadOpen(false); setUploadFile(null); }}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
            <div className="text-sm text-muted-foreground space-y-1">
              <p className="font-medium">CSV Format Requirements:</p>
              <p>• Required columns: fullName, email, username, password, role</p>
              <p>• Optional columns: department, isContractor (true/false)</p>
              <p>• Valid roles: employee, manager, admin</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
