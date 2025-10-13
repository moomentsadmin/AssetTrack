import { useQuery } from "@tanstack/react-query";
import { User, AssetAssignment, Asset } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Mail, Building2, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function EmployeesPage() {
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: assignments = [] } = useQuery<AssetAssignment[]>({
    queryKey: ["/api/assignments"],
  });

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employees & Contractors</h1>
        <p className="text-muted-foreground mt-2">
          View team members and their assigned assets
        </p>
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
    </div>
  );
}
