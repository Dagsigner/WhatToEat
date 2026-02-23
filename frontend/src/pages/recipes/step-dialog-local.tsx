import { memo, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { ImageUpload } from "@/components/shared/image-upload";
import type { LocalStep } from "./types";
import { toast } from "sonner";

interface StepDialogLocalProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editStep: LocalStep | null;
  nextNumber: number;
  onSave: (step: LocalStep) => void;
}

export const StepDialogLocal = memo(function StepDialogLocal({
  open, onOpenChange, editStep, nextNumber, onSave,
}: StepDialogLocalProps) {
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
      setNumber(nextNumber);
      setTitle("");
      setDescription("");
      setPhotoUrl("");
    }
  }, [open, editStep, nextNumber]);

  const handleSave = () => {
    onSave({
      localId: editStep?.localId ?? crypto.randomUUID(),
      step_number: number,
      title,
      description: description || undefined,
      photo_url: photoUrl || undefined,
    });
    onOpenChange(false);
    toast.success(editStep ? "Step updated" : "Step added");
  };

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
          <Button className="w-full" disabled={!title} onClick={handleSave}>
            {editStep ? "Save" : "Add Step"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});
