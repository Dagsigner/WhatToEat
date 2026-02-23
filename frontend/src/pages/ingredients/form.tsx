import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createIngredient, updateIngredient } from "@/api/ingredients";
import type { IngredientAdmin } from "@/types";
import { toast } from "sonner";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  unit_of_measurement: z.string().min(1, "Unit is required"),
  is_active: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem: IngredientAdmin | null;
}

export function IngredientFormDialog({ open, onOpenChange, editItem }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!editItem;

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", slug: "", unit_of_measurement: "", is_active: true },
  });

  useEffect(() => {
    if (open) {
      if (editItem) {
        reset({ title: editItem.title, slug: editItem.slug, unit_of_measurement: editItem.unit_of_measurement, is_active: editItem.is_active });
      } else {
        reset({ title: "", slug: "", unit_of_measurement: "", is_active: true });
      }
    }
  }, [open, editItem, reset]);

  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      isEdit ? updateIngredient(editItem!.id, data) : createIngredient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      onOpenChange(false);
      toast.success(isEdit ? "Ingredient updated" : "Ingredient created");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Ingredient" : "New Ingredient"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" {...register("slug")} />
            {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unit of measurement</Label>
            <Input id="unit" {...register("unit_of_measurement")} placeholder="g, ml, pcs..." />
            {errors.unit_of_measurement && <p className="text-sm text-destructive">{errors.unit_of_measurement.message}</p>}
          </div>
          <div className="flex items-center gap-2">
            <Switch id="is_active" checked={watch("is_active")} onCheckedChange={(v) => setValue("is_active", v)} />
            <Label htmlFor="is_active">Active</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>{isEdit ? "Update" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
