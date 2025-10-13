import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Asset, AssetNote, User } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

export function AssetNotesDialog({
  asset,
  open,
  onOpenChange,
}: {
  asset: Asset;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [note, setNote] = useState("");

  const { data: notes = [], isLoading } = useQuery<AssetNote[]>({
    queryKey: ["/api/assets", asset.id, "notes"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const mutation = useMutation({
    mutationFn: async (noteText: string) => {
      const res = await apiRequest("POST", `/api/assets/${asset.id}/notes`, {
        note: noteText,
        userId: currentUser?.id,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/assets", asset.id, "notes"] });
      setNote("");
      toast({ title: "Note added successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add note",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Asset Notes</DialogTitle>
          <DialogDescription>
            Maintenance logs and observations for {asset.name}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-[200px] max-h-[400px]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No notes yet. Add the first note below.
            </p>
          ) : (
            notes
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .map((noteItem) => {
                const author = users.find((u) => u.id === noteItem.userId);
                return (
                  <div key={noteItem.id} className="flex gap-3 p-4 bg-muted/50 rounded-lg" data-testid={`note-${noteItem.id}`}>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {author?.fullName?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium">{author?.fullName}</p>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(noteItem.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{noteItem.note}</p>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        <div className="space-y-3 pt-4 border-t">
          <Textarea
            placeholder="Add a note about this asset..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            data-testid="textarea-new-note"
          />
          <div className="flex justify-end">
            <Button
              onClick={() => mutation.mutate(note)}
              disabled={!note.trim() || mutation.isPending}
              data-testid="button-add-note"
            >
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Note
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
