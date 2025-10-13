import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Asset } from "@shared/schema";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  depreciationMethod: z.enum(["straight_line", "declining_balance"]),
  depreciationRate: z.string().min(1, "Rate is required"),
  yearsOfUse: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function DepreciationDialog({
  asset,
  open,
  onOpenChange,
}: {
  asset: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      depreciationMethod: asset.depreciationMethod || "straight_line",
      depreciationRate: asset.depreciationRate || "",
      yearsOfUse: "",
    },
  });

  const watchMethod = form.watch("depreciationMethod");
  const watchRate = form.watch("depreciationRate");
  const watchYears = form.watch("yearsOfUse");

  const purchaseCost = Number(asset.purchaseCost || 0);
  const rate = Number(watchRate || 0);
  const years = Number(watchYears || 0);

  let calculatedValue = purchaseCost;
  if (purchaseCost && rate && years) {
    if (watchMethod === "straight_line") {
      calculatedValue = Math.max(0, purchaseCost - (purchaseCost * (rate / 100) * years));
    } else {
      calculatedValue = purchaseCost * Math.pow(1 - rate / 100, years);
    }
  }

  const calculateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/assets/${asset.id}/calculate-depreciation`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({ title: "Depreciation calculated and updated" });
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const res = await apiRequest("PATCH", `/api/assets/${asset.id}/depreciation`, {
        depreciationMethod: data.depreciationMethod,
        depreciationRate: data.depreciationRate,
        yearsOfUse: data.yearsOfUse || "0",
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets"] });
      toast({ title: "Depreciation updated successfully" });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update depreciation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Asset Depreciation Calculator</DialogTitle>
          <DialogDescription>
            Configure depreciation method and calculate current asset value for {asset.name}
          </DialogDescription>
        </DialogHeader>

        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Purchase Cost</p>
                <p className="text-2xl font-bold">${purchaseCost.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Current Value</p>
                <p className="text-2xl font-bold text-primary">
                  ${calculatedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            {years > 0 && (
              <div className="mt-4 pt-4 border-t flex items-center gap-2 text-sm">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-muted-foreground">Depreciation:</span>
                <span className="font-medium text-destructive">
                  ${(purchaseCost - calculatedValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  ({((purchaseCost - calculatedValue) / purchaseCost * 100).toFixed(1)}%)
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField
              control={form.control}
              name="depreciationMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Depreciation Method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-depreciation-method">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="straight_line">Straight Line</SelectItem>
                      <SelectItem value="declining_balance">Declining Balance</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {watchMethod === "straight_line"
                      ? "Equal depreciation each year"
                      : "Higher depreciation in early years"}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="depreciationRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Annual Depreciation Rate (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="e.g., 20 for 20% per year"
                      {...field}
                      data-testid="input-depreciation-rate"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="yearsOfUse"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Years of Use (for calculation)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="e.g., 2.5"
                      {...field}
                      data-testid="input-years-use"
                    />
                  </FormControl>
                  <FormDescription>
                    This is only for preview. The system will auto-calculate based on purchase date.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {asset.purchaseDate && asset.depreciationMethod && asset.depreciationRate && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => calculateMutation.mutate()}
                  disabled={calculateMutation.isPending}
                  data-testid="button-auto-calculate"
                >
                  {calculateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Auto-Calculate
                </Button>
              )}
              <Button type="submit" disabled={mutation.isPending} data-testid="button-save-depreciation">
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Configuration
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
