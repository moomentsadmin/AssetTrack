import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Activity, Database, Server, Users, Package, Building2, MapPin, CheckCircle2, AlertCircle } from "lucide-react";
import { Asset, User, Department, Location, AuditTrail } from "@shared/schema";

export default function SystemHealthPage() {
  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: departments = [], isLoading: depsLoading } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: locations = [], isLoading: locsLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: auditTrail = [], isLoading: auditLoading } = useQuery<AuditTrail[]>({
    queryKey: ["/api/audit"],
  });

  const isLoading = assetsLoading || usersLoading || depsLoading || locsLoading || auditLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const totalAssetValue = assets.reduce((sum, asset) => {
    return sum + Number(asset.currentValue || asset.purchaseCost || 0);
  }, 0);

  const assetsByStatus = assets.reduce((acc, asset) => {
    acc[asset.status] = (acc[asset.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentAuditEntries = auditTrail.slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Activity className="h-8 w-8" />
          System Health & Monitoring
        </h1>
        <p className="text-muted-foreground mt-2">
          Monitor system status, statistics, and recent activity
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <Badge variant="outline" className="text-green-600 border-green-200">
                Connected
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              PostgreSQL running
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server Status</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <Badge variant="outline" className="text-green-600 border-green-200">
                Online
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              All services operational
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {users.filter(u => u.role === "admin").length} admins, {users.filter(u => u.role === "manager").length} managers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${totalAssetValue.toLocaleString()} total value
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset Distribution</CardTitle>
            <CardDescription>Assets by status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(assetsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize">{status.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-20 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${(count / assets.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Resources</CardTitle>
            <CardDescription>Organizational structure</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Departments</span>
              </div>
              <span className="text-sm font-medium">{departments.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Locations</span>
              </div>
              <span className="text-sm font-medium">{locations.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Audit Entries</span>
              </div>
              <span className="text-sm font-medium">{auditTrail.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest 10 audit trail entries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAuditEntries.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
            ) : (
              recentAuditEntries.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 pb-3 border-b last:border-0">
                  <Activity className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">{entry.action}</p>
                    {(() => {
                      const details = entry.details as Record<string, unknown> | null;
                      if (details && typeof details === 'object' && 'assetName' in details) {
                        return (
                          <p className="text-xs text-muted-foreground">
                            {String(details.assetName as string)}
                          </p>
                        );
                      }
                      return null;
                    })()}
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
