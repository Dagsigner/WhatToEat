import { memo, useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { createStep, updateStep } from "@/api/steps";
import { ImageUpload } from "@/components/shared/image-upload";
import type { StepResponse } from "@/types";
import { toast } from "sonner";

interface StepDialogApiProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  recipeId: string;
  editStep: StepResponse | null;
  onSaved: () => void;
}

export const StepDialogApi = memo(function StepDialogApi({
  open, onOpenChange, recipeId, editStep, onSaved,
}: StepDialogApiProps) {
  const [number, setNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    if (open && editStep) {
      setNumber(editStep.step_number);
      setTitle(editStep.title);
      setDescription(editStep.description ?? "");
      setPhotoUrl(editStep.photo_url ?? "");
    } else if (open) {
      setNumber(1);
      setTitle("");
      setDescription("");
      setPhotoUrl("");
    }
  }, [open, editStep]);

  const mutation = useMutation({
    mutationFn: () => {
      if (editStep) {
        return updateStep(editStep.id, { step_number: number, title, description: description || undefined, photo_url: photoUrl || undefined });
      }
      return createStep({ recipe_id: recipeId, step_number: number, title, description: description || undefined, photo_url: photoUrl || undefined });
    },
    onSuccess: () => {
      onSaved();
      onOpenChange(false);
      toast.success(editStep ? "Step updated" : "Step created");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{editStep ? "Edit Step" : "Add Step"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Step #</Label>
              <Input type="number" min={1} value={number} onChange={(e) => setNumber(Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <ImageUpload
            label="Step Photo (optional)"
            value={photoUrl}
            onChange={setPhotoUrl}
          />
          <Button className="w-full" disabled={!title || mutation.isPending} onClick={() => mutation.mutate()}>
            {editStep ? "Save" : "Add Step"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
