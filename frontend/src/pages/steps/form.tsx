import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/shared/image-upload";
import { createStep, updateStep } from "@/api/steps";
import type { StepAdmin } from "@/types";
import { toast } from "sonner";

const createSchema = z.object({
  recipe_id: z.string().min(1, "Recipe ID is required"),
  step_number: z.coerce.number().min(1, "Step number must be >= 1"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  photo_url: z.string().optional(),
  slug: z.string().optional(),
  is_active: z.boolean(),
});

const editSchema = z.object({
  step_number: z.coerce.number().min(1).optional(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  photo_url: z.string().optional(),
  slug: z.string().optional(),
  is_active: z.boolean(),
});

type CreateData = z.infer<typeof createSchema>;
type EditData = z.infer<typeof editSchema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editItem: StepAdmin | null;
}

export function StepFormDialog({ open, onOpenChange, editItem }: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!editItem;

  const {
    register, handleSubmit, reset, setValue, watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateData>({
    resolver: zodResolver(isEdit ? editSchema : createSchema) as never,
    defaultValues: {
      recipe_id: "", step_number: 1, title: "",
      description: "", photo_url: "", slug: "", is_active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (editItem) {
        reset({
          recipe_id: editItem.recipe_id,
          step_number: editItem.step_number,
          title: editItem.title,
          description: editItem.description ?? "",
          photo_url: editItem.photo_url ?? "",
          slug: editItem.slug ?? "",
          is_active: editItem.is_active,
        });
      } else {
        reset({
          recipe_id: "", step_number: 1, title: "",
          description: "", photo_url: "", slug: "", is_active: true,
        });
      }
    }
  }, [open, editItem, reset]);

  const mutation = useMutation({
    mutationFn: (data: CreateData) => {
      if (isEdit) {
        const { recipe_id: _rid, ...rest } = data;
        return updateStep(editItem!.id, rest as EditData);
      }
      return createStep(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["steps"] });
      onOpenChange(false);
      toast.success(isEdit ? "Step updated" : "Step created");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Step" : "New Step"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          {!isEdit && (
            <div className="space-y-2">
              <Label htmlFor="recipe_id">Recipe ID</Label>
              <Input id="recipe_id" placeholder="UUID of the recipe" {...register("recipe_id")} />
              {errors.recipe_id && <p className="text-sm text-destructive">{errors.recipe_id.message}</p>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="step_number">Step Number</Label>
              <Input id="step_number" type="number" min={1} {...register("step_number")} />
              {errors.step_number && <p className="text-sm text-destructive">{errors.step_number.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (optional)</Label>
              <Input id="slug" {...register("slug")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" rows={3} {...register("description")} />
          </div>
          <ImageUpload
            label="Step Photo (optional)"
            value={watch("photo_url") ?? ""}
            onChange={(url) => setValue("photo_url", url)}
          />
          <div className="flex items-center gap-2">
            <Switch id="is_active" checked={watch("is_active")} onCheckedChange={(v) => setValue("is_active", v)} />
            <Label htmlFor="is_active">Active</Label>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || mutation.isPending}>
              {isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
