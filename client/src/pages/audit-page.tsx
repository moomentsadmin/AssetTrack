import { useQuery } from "@tanstack/react-query";
import { AuditTrail, User, Asset } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AuditPage() {
  const { data: auditTrail = [], isLoading } = useQuery<AuditTrail[]>({
    queryKey: ["/api/audit"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const sortedTrail = [...auditTrail].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
        <p className="text-muted-foreground mt-2">
          Complete history of all asset-related activities
        </p>
      </div>

      <Card className="p-6">
        {sortedTrail.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No audit trail entries yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedTrail.map((entry) => {
              const user = users.find((u) => u.id === entry.userId);
              const asset = entry.assetId ? assets.find((a) => a.id === entry.assetId) : null;

              return (
                <div
                  key={entry.id}
                  className="flex gap-4 pb-4 border-b last:border-0 last:pb-0"
                  data-testid={`audit-entry-${entry.id}`}
                >
                  <div className="p-2 bg-muted rounded-lg h-fit">
                    <History className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{entry.action}</p>
                        {asset && (
                          <p className="text-sm text-muted-foreground truncate">
                            Asset: {asset.name}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs">
                        {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      By {user?.fullName || "Unknown"}
                    </p>
                    {entry.details && typeof entry.details === 'object' && (
                      <div className="mt-2 p-3 bg-muted/50 rounded-md">
                        <pre className="text-xs text-muted-foreground overflow-x-auto">
                          {JSON.stringify(entry.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
