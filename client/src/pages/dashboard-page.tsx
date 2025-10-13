import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, AlertTriangle, CheckCircle, Loader2, TrendingDown } from "lucide-react";
import { Asset, AssetAssignment, User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function DashboardPage() {
  const [, setLocation] = useLocation();

  const { data: assets = [], isLoading: assetsLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<AssetAssignment[]>({
    queryKey: ["/api/assignments"],
  });

  const isLoading = assetsLoading || usersLoading || assignmentsLoading;

  const availableAssets = assets.filter((a) => a.status === "available").length;
  const assignedAssets = assets.filter((a) => a.status === "assigned").length;
  const maintenanceAssets = assets.filter((a) => a.status === "in_maintenance").length;
  
  const warrantyExpiringSoon = assets.filter((a) => {
    if (!a.warrantyExpiry) return false;
    const daysUntilExpiry = Math.floor(
      (new Date(a.warrantyExpiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  }).length;

  const totalValue = assets.reduce((sum, asset) => {
    return sum + Number(asset.currentValue || asset.purchaseCost || 0);
  }, 0);

  const recentAssignments = assignments
    .filter(a => !a.returnedAt)
    .sort((a, b) => new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime())
    .slice(0, 5);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Overview of your asset management system
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-total-assets">{assets.length}</div>
            <div className="flex gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-chart-2" />
                {availableAssets} available
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-assigned">{assignedAssets}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Currently in use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warranty Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-warranty">{warrantyExpiringSoon}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Expiring in 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-value">
              ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Current asset value
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Asset Status Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-chart-2" />
                <span className="text-sm">Available</span>
              </div>
              <span className="text-sm font-medium">{availableAssets}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-chart-4" />
                <span className="text-sm">Assigned</span>
              </div>
              <span className="text-sm font-medium">{assignedAssets}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-chart-3" />
                <span className="text-sm">In Maintenance</span>
              </div>
              <span className="text-sm font-medium">{maintenanceAssets}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-muted" />
                <span className="text-sm">Other</span>
              </div>
              <span className="text-sm font-medium">
                {assets.length - availableAssets - assignedAssets - maintenanceAssets}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Recent Assignments</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/assets")}
              data-testid="button-view-all-assets"
            >
              View All
            </Button>
          </CardHeader>
          <CardContent>
            {recentAssignments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No recent assignments
              </p>
            ) : (
              <div className="space-y-3">
                {recentAssignments.map((assignment) => {
                  const asset = assets.find((a) => a.id === assignment.assetId);
                  const user = users.find((u) => u.id === assignment.userId);
                  
                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between gap-4 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{asset?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.fullName}
                        </p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {new Date(assignment.assignedAt).toLocaleDateString()}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
