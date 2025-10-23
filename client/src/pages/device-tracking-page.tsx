import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, MapPin, Activity, HardDrive, Cpu, Copy, Check, Eye, EyeOff } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { DeviceTracking, Asset } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function DeviceTrackingPage() {
  const { toast } = useToast();
  const [dialogState, setDialogState] = useState<{
    type: "enable" | "view-token" | null;
    tracking?: DeviceTracking;
    assetId?: string;
  }>({ type: null });
  const [copiedToken, setCopiedToken] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");

  const { data: trackingData = [], isLoading } = useQuery<DeviceTracking[]>({
    queryKey: ["/api/device-tracking"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: assets = [] } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const enableMutation = useMutation({
    mutationFn: async (assetId: string) => {
      const response = await apiRequest("POST", "/api/device-tracking", { assetId });
      return response.json() as Promise<DeviceTracking>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/device-tracking"] });
      toast({
        title: "Tracking Enabled",
        description: "Device tracking has been enabled for this asset.",
      });
      setDialogState({ type: "view-token", tracking: data });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to enable device tracking",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/device-tracking/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/device-tracking"] });
      toast({
        title: "Tracking Disabled",
        description: "Device tracking has been disabled.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to disable device tracking",
        variant: "destructive",
      });
    },
  });

  const getAssetName = (assetId: string) => {
    const asset = assets.find((a) => a.id === assetId);
    return asset?.name || "Unknown Asset";
  };

  const formatTimestamp = (timestamp: Date | string | null) => {
    if (!timestamp) return "Never";
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const getStatusBadge = (lastHeartbeat: Date | string | null) => {
    if (!lastHeartbeat) return <Badge variant="secondary">Never Connected</Badge>;
    
    const date = typeof lastHeartbeat === 'string' ? new Date(lastHeartbeat) : lastHeartbeat;
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffMinutes < 10) return <Badge className="bg-green-600 hover:bg-green-700">Online</Badge>;
    if (diffMinutes < 60) return <Badge variant="secondary">Idle</Badge>;
    return <Badge variant="destructive">Offline</Badge>;
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
    toast({
      title: "Copied",
      description: "Tracking token copied to clipboard",
    });
  };

  const untrackedAssets = assets.filter(
    (asset) => !trackingData.some((t) => t.assetId === asset.id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Device Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Monitor real-time location and system resources of tracked devices
          </p>
        </div>
        <Button
          onClick={() => setDialogState({ type: "enable" })}
          data-testid="button-enable-tracking"
        >
          <Plus className="mr-2 h-4 w-4" />
          Enable Tracking
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>CPU</TableHead>
                <TableHead>Memory</TableHead>
                <TableHead>Disk</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trackingData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No devices are being tracked
                  </TableCell>
                </TableRow>
              ) : (
                trackingData.map((tracking) => (
                  <TableRow key={tracking.id} data-testid={`row-tracking-${tracking.id}`}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{getAssetName(tracking.assetId)}</div>
                        {tracking.hostname && (
                          <div className="text-xs text-muted-foreground">{tracking.hostname}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(tracking.lastHeartbeat)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTimestamp(tracking.lastHeartbeat)}
                    </TableCell>
                    <TableCell>
                      {tracking.latitude && tracking.longitude ? (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono text-xs">
                            {Number(tracking.latitude).toFixed(4)}, {Number(tracking.longitude).toFixed(4)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tracking.cpuUsage ? (
                        <div className="flex items-center gap-2">
                          <Cpu className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{Number(tracking.cpuUsage).toFixed(1)}%</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tracking.memoryUsage ? (
                        <div className="flex items-center gap-2">
                          <Activity className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{Number(tracking.memoryUsage).toFixed(1)}%</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tracking.diskUsage ? (
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{Number(tracking.diskUsage).toFixed(1)}%</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDialogState({ type: "view-token", tracking })}
                          data-testid={`button-view-token-${tracking.id}`}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Are you sure you want to disable tracking for this device?")) {
                              deleteMutation.mutate(tracking.id);
                            }
                          }}
                          data-testid={`button-delete-${tracking.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Enable Tracking Dialog */}
      <Dialog open={dialogState.type === "enable"} onOpenChange={(open) => !open && setDialogState({ type: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Device Tracking</DialogTitle>
            <DialogDescription>
              Select an asset to enable tracking. You'll receive a tracking token to install on the device.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="asset">Asset</Label>
              <Select value={selectedAssetId} onValueChange={setSelectedAssetId}>
                <SelectTrigger data-testid="select-asset">
                  <SelectValue placeholder="Select an asset" />
                </SelectTrigger>
                <SelectContent>
                  {untrackedAssets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      {asset.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogState({ type: null })}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (selectedAssetId) {
                  enableMutation.mutate(selectedAssetId);
                }
              }}
              disabled={!selectedAssetId || enableMutation.isPending}
              data-testid="button-confirm-enable"
            >
              {enableMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enable Tracking
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Token Dialog */}
      <Dialog open={dialogState.type === "view-token"} onOpenChange={(open) => !open && setDialogState({ type: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tracking Token</DialogTitle>
            <DialogDescription>
              Install the tracking agent on the device using this token. Keep this token secure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Tracking Token</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  type={showToken ? "text" : "password"}
                  value={dialogState.tracking?.trackingToken || ""}
                  className="font-mono text-sm"
                  data-testid="input-token"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowToken(!showToken)}
                  data-testid="button-toggle-token"
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToken(dialogState.tracking?.trackingToken || "")}
                  data-testid="button-copy-token"
                >
                  {copiedToken ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="rounded-md bg-muted p-4 text-sm space-y-2">
              <p className="font-medium">Installation Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>Download the tracking agent from the tracking-agent folder</li>
                <li>Install dependencies: npm install</li>
                <li>Set the tracking token as an environment variable</li>
                <li>Run the agent: npm start</li>
              </ol>
              <p className="text-xs text-muted-foreground mt-2">
                See tracking-agent/README.md for detailed instructions
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setDialogState({ type: null })} data-testid="button-close-token">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
