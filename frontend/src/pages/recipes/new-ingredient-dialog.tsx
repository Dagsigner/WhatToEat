import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { createIngredient } from "@/api/ingredients";
import type { IngredientAdmin } from "@/types";

interface NewIngredientDialogProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: (i: IngredientAdmin) => void;
}

export function NewIngredientDialog({ open, onOpenChange, onCreated }: NewIngredientDialogProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [unit, setUnit] = useState("g");
  const mutation = useMutation({
    mutationFn: () => createIngredient({ title, slug, unit_of_measurement: unit, is_active: true }),
    onSuccess: (i) => {
      queryClient.invalidateQueries({ queryKey: ["ingredients", "all"] });
      onCreated(i);
      onOpenChange(false);
      setTitle("");
      setSlug("");
      setUnit("g");
    },
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>New Ingredient</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => { setTitle(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")); }} />
          </div>
          <div className="space-y-1">
            <Label>Slug</Label>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Unit of measurement</Label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="g, ml, pcs, tbsp..." />
          </div>
          <Button className="w-full" disabled={!title || mutation.isPending} onClick={() => mutation.mutate()}>
            Create Ingredient
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
