import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Search, Filter, Loader2, MoreVertical, Edit, Trash2, UserPlus, FileText, DollarSign, QrCode } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Asset, Department, AssetType } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AssetForm } from "@/components/asset-form";
import { AssignAssetDialog } from "@/components/assign-asset-dialog";
import { AssetNotesDialog } from "@/components/asset-notes-dialog";
import { DepreciationDialog } from "@/components/depreciation-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statusColors = {
  available: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  assigned: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  in_maintenance: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  retired: "bg-muted/50 text-muted-foreground border-muted",
  lost: "bg-destructive/10 text-destructive border-destructive/20",
  disposed: "bg-muted/50 text-muted-foreground border-muted",
};

export default function AssetsPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [dialogState, setDialogState] = useState<{
    type: "create" | "edit" | "assign" | "notes" | "depreciation" | null;
    asset?: Asset;
  }>({ type: null });

  const { data: assets = [], isLoading } = useQuery<Asset[]>({
    queryKey: ["/api/assets"],
  });

  const { data: departments = [] } = useQuery<Department[]>({
    queryKey: ["/api/departments"],
  });

  const { data: assetTypes = [] } = useQuery<AssetType[]>({
    queryKey: ["/api/asset-types"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/assets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({ title: "Asset deleted successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete asset",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredAssets = assets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(search.toLowerCase()) ||
      asset.serialNumber?.toLowerCase().includes(search.toLowerCase()) ||
      asset.model?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || asset.status === statusFilter;
    const matchesType = typeFilter === "all" || asset.assetTypeId === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assets</h1>
          <p className="text-muted-foreground mt-2">
            Manage your hardware, software, and equipment inventory
          </p>
        </div>
        <Button onClick={() => setDialogState({ type: "create" })} data-testid="button-add-asset">
          <Plus className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              data-testid="input-search-assets"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="in_maintenance">Maintenance</SelectItem>
              <SelectItem value="retired">Retired</SelectItem>
              <SelectItem value="lost">Lost</SelectItem>
              <SelectItem value="disposed">Disposed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-type-filter">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {assetTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Department</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No assets found
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssets.map((asset) => {
                  const dept = departments.find(d => d.id === asset.departmentId);
                  const assetType = assetTypes.find(at => at.id === asset.assetTypeId);
                  return (
                    <TableRow key={asset.id} data-testid={`row-asset-${asset.id}`}>
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {assetType?.name || "Unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {asset.serialNumber || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[asset.status]} variant="outline">
                          {asset.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        ${Number(asset.currentValue || asset.purchaseCost || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>{dept?.name || "-"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-actions-${asset.id}`}>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDialogState({ type: "edit", asset })}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDialogState({ type: "assign", asset })}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Assign
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDialogState({ type: "notes", asset })}>
                              <FileText className="mr-2 h-4 w-4" />
                              Notes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDialogState({ type: "depreciation", asset })}>
                              <DollarSign className="mr-2 h-4 w-4" />
                              Depreciation
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setLocation(`/assets/${asset.id}/print-label`)}>
                              <QrCode className="mr-2 h-4 w-4" />
                              Print Label
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => deleteMutation.mutate(asset.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={dialogState.type === "create" || dialogState.type === "edit"} onOpenChange={(open) => !open && setDialogState({ type: null })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogState.type === "create" ? "Add New Asset" : "Edit Asset"}</DialogTitle>
            <DialogDescription>
              {dialogState.type === "create"
                ? "Add a new asset to your inventory"
                : "Update asset information"}
            </DialogDescription>
          </DialogHeader>
          <AssetForm
            asset={dialogState.asset}
            onSuccess={() => setDialogState({ type: null })}
          />
        </DialogContent>
      </Dialog>

      {dialogState.type === "assign" && dialogState.asset && (
        <AssignAssetDialog
          asset={dialogState.asset}
          open={true}
          onOpenChange={(open) => !open && setDialogState({ type: null })}
        />
      )}

      {dialogState.type === "notes" && dialogState.asset && (
        <AssetNotesDialog
          asset={dialogState.asset}
          open={true}
          onOpenChange={(open) => !open && setDialogState({ type: null })}
        />
      )}

      {dialogState.type === "depreciation" && dialogState.asset && (
        <DepreciationDialog
          asset={dialogState.asset}
          open={true}
          onOpenChange={(open) => !open && setDialogState({ type: null })}
        />
      )}
    </div>
  );
}
