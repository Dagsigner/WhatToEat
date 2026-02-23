import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { createCategory } from "@/api/categories";
import type { CategoryAdmin } from "@/types";

interface NewCategoryDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (c: CategoryAdmin) => void;
}

export function NewCategoryDialog({ open, onOpenChange, onCreated }: NewCategoryDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const mutation = useMutation({
    mutationFn: () => createCategory({ title, slug, is_active: true }),
    onSuccess: (c) => {
      queryClient.invalidateQueries({ queryKey: ["categories", "all"] });
      onCreated(c);
      onOpenChange(false);
      setTitle("");
      setSlug("");
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>New Category</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => { setTitle(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")); }} />
          </div>
          <div className="space-y-1">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <Button className="w-full" disabled={!title || mutation.isPending} onClick={() => mutation.mutate()}>
            Create Category
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
