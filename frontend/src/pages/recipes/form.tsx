import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Pencil, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { getRecipe, createRecipe, updateRecipe } from "@/api/recipes";
import { listCategories } from "@/api/categories";
import { listIngredients } from "@/api/ingredients";
import { createStep, deleteStep } from "@/api/steps";
import { ImageUpload } from "@/components/shared/image-upload";
import type { StepResponse, RecipeIngredientResponse } from "@/types";
import { toast } from "sonner";
import type { IngredientRow, LocalStep } from "./types";
import { NewCategoryDialog } from "./new-category-dialog";
import { NewIngredientDialog } from "./new-ingredient-dialog";
import { StepDialogApi } from "./step-dialog-api";
import { StepDialogLocal } from "./step-dialog-local";

const optionalDecimal = z.preprocess(
  (val) => (val === "" || val === null || val === undefined ? null : val),
  z.coerce.number().min(0).nullable(),
);

const recipeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  photo_url: z.string().optional().default(""),
  description: z.string().min(1, "Description is required"),
  prep_time: z.coerce.number().min(0),
  cook_time: z.coerce.number().min(0),
  difficulty: z.string().min(1),
  servings: z.string().min(1, "Servings is required"),
  protein: optionalDecimal,
  fat: optionalDecimal,
  carbs: optionalDecimal,
  is_active: z.boolean(),
});

type RecipeFormData = z.infer<typeof recipeSchema>;

export default function RecipeFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // recipe data (edit mode)
  const { data: recipe, isLoading, refetch: refetchRecipe } = useQuery({
    queryKey: ["recipe", id],
    queryFn: () => getRecipe(id!),
    enabled: isEdit,
  });

  // category & ingredient lists
  const { data: categoriesData } = useQuery({
    queryKey: ["categories", "all"],
    queryFn: () => listCategories(100, 0),
  });
  const { data: ingredientsData } = useQuery({
    queryKey: ["ingredients", "all"],
    queryFn: () => listIngredients(100, 0),
  });

  // form
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema) as never,
    defaultValues: {
      title: "", slug: "", photo_url: "", description: "",
      prep_time: 0, cook_time: 0, difficulty: "medium", servings: "",
      protein: null, fat: null, carbs: null, is_active: true,
    },
  });

  // local state for relations
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [ingredientRows, setIngredientRows] = useState<IngredientRow[]>([]);

  // local steps (for create mode — not yet saved to server)
  const [localSteps, setLocalSteps] = useState<LocalStep[]>([]);
  const [editingLocalStep, setEditingLocalStep] = useState<LocalStep | null>(null);

  // dialogs
  const [newCatOpen, setNewCatOpen] = useState(false);
  const [newIngOpen, setNewIngOpen] = useState(false);
  const [stepDialogOpen, setStepDialogOpen] = useState(false);
  const [localStepDialogOpen, setLocalStepDialogOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<StepResponse | null>(null);
  const [deleteStepTarget, setDeleteStepTarget] = useState<StepResponse | null>(null);

  // ingredient picker state
  const [pickIngId, setPickIngId] = useState("");
  const [pickAmount, setPickAmount] = useState(1);

  const lastLoadedRecipeIdRef = useRef<string | null>(null);

  // populate form on recipe load — only when recipe id changes (not on refetch)
  useEffect(() => {
    if (recipe && recipe.id !== lastLoadedRecipeIdRef.current) {
      lastLoadedRecipeIdRef.current = recipe.id;
      reset({
        title: recipe.title, slug: recipe.slug, photo_url: recipe.photo_url,
        description: recipe.description, prep_time: recipe.prep_time,
        cook_time: recipe.cook_time, difficulty: recipe.difficulty,
        servings: recipe.servings, protein: recipe.protein, fat: recipe.fat,
        carbs: recipe.carbs, is_active: recipe.is_active,
      });
      setSelectedCategoryIds(recipe.categories.map((c) => c.id));
      setIngredientRows(
        recipe.recipe_ingredients.map((ri: RecipeIngredientResponse) => ({
          ingredient_id: ri.ingredient_id,
          title: ri.ingredient?.title ?? "Unknown",
          unit: ri.ingredient?.unit_of_measurement ?? "",
          amount: ri.amount,
        })),
      );
    }
  }, [recipe, reset]);

  // save recipe
  const mutation = useMutation({
    mutationFn: (data: RecipeFormData) => {
      const ingredientPayload = ingredientRows.map((r) => ({
        ingredient_id: r.ingredient_id, amount: r.amount,
      }));
      if (isEdit) {
        return updateRecipe(id!, {
          ...data,
          categories: selectedCategoryIds,
          ingredients: ingredientPayload,
        });
      }
      return createRecipe({
        ...data,
        category_ids: selectedCategoryIds,
        ingredient_ids: ingredientPayload,
      });
    },
    onSuccess: async (result) => {
      if (!isEdit && localSteps.length > 0) {
        for (const ls of localSteps) {
          try {
            await createStep({
              recipe_id: result.id,
              step_number: ls.step_number,
              title: ls.title,
              description: ls.description,
              photo_url: ls.photo_url,
            });
          } catch {
            toast.error(`Failed to create step "${ls.title}"`);
          }
        }
      }
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      if (isEdit && id) {
        queryClient.invalidateQueries({ queryKey: ["recipe", id] });
      }
      toast.success(isEdit ? "Recipe updated" : "Recipe created");
      if (!isEdit) {
        navigate(`/recipes/${result.id}/edit`);
      }
    },
  });

  // delete step
  const deleteStepMutation = useMutation({
    mutationFn: (stepId: string) => deleteStep(stepId),
    onSuccess: () => {
      refetchRecipe();
      setDeleteStepTarget(null);
      toast.success("Step deleted");
    },
  });

  // --- ingredient picker helpers ---
  const addIngredient = () => {
    if (!pickIngId) return;
    if (ingredientRows.some((r) => r.ingredient_id === pickIngId)) {
      toast.error("Ingredient already added");
      return;
    }
    const ing = ingredientsData?.items.find((i) => i.id === pickIngId);
    if (!ing) return;
    setIngredientRows([...ingredientRows, {
      ingredient_id: ing.id, title: ing.title, unit: ing.unit_of_measurement, amount: pickAmount,
    }]);
    setPickIngId("");
    setPickAmount(1);
  };

  const removeIngredient = (ingId: string) => {
    setIngredientRows(ingredientRows.filter((r) => r.ingredient_id !== ingId));
  };

  const updateIngredientAmount = (ingId: string, amount: number) => {
    setIngredientRows(ingredientRows.map((r) => r.ingredient_id === ingId ? { ...r, amount } : r));
  };

  if (isEdit && isLoading) return <LoadingSpinner />;

  const availableIngredients = ingredientsData?.items.filter(
    (i) => !ingredientRows.some((r) => r.ingredient_id === i.id),
  ) ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={isEdit ? "Edit Recipe" : "New Recipe"} />
      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6 max-w-3xl">

        {/* ===== BASIC INFO ===== */}
        <Card>
          <CardHeader><CardTitle>Basic Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input {...register("title")} />
                {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>Slug</Label>
                <Input {...register("slug")} />
                {errors.slug && <p className="text-sm text-destructive">{errors.slug.message}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <ImageUpload
                label="Recipe Photo"
                value={watch("photo_url") ?? ""}
                onChange={(url) => setValue("photo_url", url, { shouldValidate: true })}
              />
              {errors.photo_url && <p className="text-sm text-destructive">{errors.photo_url.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea rows={4} {...register("description")} />
              {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Difficulty</Label>
                <Select value={watch("difficulty")} onValueChange={(v) => setValue("difficulty", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Servings</Label>
                <Input {...register("servings")} />
              </div>
              <div className="flex items-end gap-2 pb-1">
                <Switch id="active" checked={watch("is_active")} onCheckedChange={(v) => setValue("is_active", v)} />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prep time (min)</Label>
                <Input type="number" {...register("prep_time")} />
              </div>
              <div className="space-y-2">
                <Label>Cook time (min)</Label>
                <Input type="number" {...register("cook_time")} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ===== NUTRITION ===== */}
        <Card>
          <CardHeader><CardTitle>Nutrition (optional)</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2"><Label>Protein (g)</Label><Input type="number" step="0.1" {...register("protein")} /></div>
              <div className="space-y-2"><Label>Fat (g)</Label><Input type="number" step="0.1" {...register("fat")} /></div>
              <div className="space-y-2"><Label>Carbs (g)</Label><Input type="number" step="0.1" {...register("carbs")} /></div>
            </div>
          </CardContent>
        </Card>

        {/* ===== CATEGORIES ===== */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Categories</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => setNewCatOpen(true)}>
              <Plus className="mr-1 h-3 w-3" /> New
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {categoriesData?.items.map((cat) => {
                const selected = selectedCategoryIds.includes(cat.id);
                return (
                  <Button
                    key={cat.id} type="button" size="sm"
                    variant={selected ? "default" : "outline"}
                    onClick={() => setSelectedCategoryIds(
                      selected
                        ? selectedCategoryIds.filter((x) => x !== cat.id)
                        : [...selectedCategoryIds, cat.id],
                    )}
                  >
                    {cat.title}
                  </Button>
                );
              })}
              {(!categoriesData || categoriesData.items.length === 0) && (
                <p className="text-sm text-muted-foreground">No categories yet. Create one above.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ===== INGREDIENTS ===== */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Ingredients</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => setNewIngOpen(true)}>
              <Plus className="mr-1 h-3 w-3" /> New Ingredient
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* picker */}
            <div className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label>Ingredient</Label>
                <Select value={pickIngId} onValueChange={setPickIngId}>
                  <SelectTrigger><SelectValue placeholder="Select ingredient..." /></SelectTrigger>
                  <SelectContent>
                    {availableIngredients.map((i) => (
                      <SelectItem key={i.id} value={i.id}>
                        {i.title} ({i.unit_of_measurement})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24 space-y-1">
                <Label>Amount</Label>
                <Input type="number" min={0} step="0.1" value={pickAmount} onChange={(e) => setPickAmount(Number(e.target.value))} />
              </div>
              <Button type="button" size="sm" disabled={!pickIngId} onClick={addIngredient}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Separator />

            {ingredientRows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-2">No ingredients added</p>
            ) : (
              <div className="space-y-2">
                {ingredientRows.map((row) => (
                  <div key={row.ingredient_id} className="flex items-center gap-3 rounded-md border px-3 py-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                    <span className="flex-1 font-medium text-sm">{row.title}</span>
                    <Input
                      type="number" min={0} step="0.1" className="w-20 h-8"
                      value={row.amount}
                      onChange={(e) => updateIngredientAmount(row.ingredient_id, Number(e.target.value))}
                    />
                    <span className="text-xs text-muted-foreground w-10">{row.unit}</span>
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeIngredient(row.ingredient_id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===== STEPS ===== */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Steps</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={() => {
              if (isEdit) {
                setEditingStep(null);
                setStepDialogOpen(true);
              } else {
                setEditingLocalStep(null);
                setLocalStepDialogOpen(true);
              }
            }}>
              <Plus className="mr-1 h-3 w-3" /> Add Step
            </Button>
          </CardHeader>
          <CardContent>
            {isEdit ? (
              (!recipe?.steps || recipe.steps.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No steps yet. Click &quot;Add Step&quot; to create the first one.
                </p>
              ) : (
                <div className="space-y-2">
                  {[...recipe.steps].sort((a, b) => a.step_number - b.step_number).map((step) => (
                    <div key={step.id} className="flex items-start gap-3 rounded-md border px-3 py-3">
                      <Badge variant="secondary" className="mt-0.5 shrink-0">{step.step_number}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{step.title}</p>
                        {step.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{step.description}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => { setEditingStep(step); setStepDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => setDeleteStepTarget(step)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              localSteps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No steps yet. Click &quot;Add Step&quot; to add one.
                </p>
              ) : (
                <div className="space-y-2">
                  {[...localSteps].sort((a, b) => a.step_number - b.step_number).map((step) => (
                    <div key={step.localId} className="flex items-start gap-3 rounded-md border px-3 py-3">
                      <Badge variant="secondary" className="mt-0.5 shrink-0">{step.step_number}</Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{step.title}</p>
                        {step.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{step.description}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => { setEditingLocalStep(step); setLocalStepDialogOpen(true); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8"
                          onClick={() => setLocalSteps(localSteps.filter((s) => s.localId !== step.localId))}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </CardContent>
        </Card>

        {/* ===== SUBMIT ===== */}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate("/recipes")}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting || mutation.isPending}>
            {isEdit ? "Update Recipe" : "Create Recipe"}
          </Button>
        </div>
      </form>

      {/* ===== DIALOGS ===== */}
      <NewCategoryDialog
        open={newCatOpen}
        onOpenChange={setNewCatOpen}
        onCreated={(c) => {
          setSelectedCategoryIds((prev) => [...prev, c.id]);
          toast.success(`Category "${c.title}" created`);
        }}
      />
      <NewIngredientDialog
        open={newIngOpen}
        onOpenChange={setNewIngOpen}
        onCreated={(i) => {
          setPickIngId(i.id);
          toast.success(`Ingredient "${i.title}" created — now set amount and add`);
        }}
      />
      {isEdit && id && (
        <StepDialogApi
          open={stepDialogOpen}
          onOpenChange={setStepDialogOpen}
          recipeId={id}
          editStep={editingStep}
          onSaved={() => refetchRecipe()}
        />
      )}
      {!isEdit && (
        <StepDialogLocal
          open={localStepDialogOpen}
          onOpenChange={setLocalStepDialogOpen}
          editStep={editingLocalStep}
          nextNumber={localSteps.length + 1}
          onSave={(step) => {
            setLocalSteps((prev) => {
              const idx = prev.findIndex((s) => s.localId === step.localId);
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = step;
                return updated;
              }
              return [...prev, step];
            });
          }}
        />
      )}
      <ConfirmDialog
        open={!!deleteStepTarget}
        onOpenChange={(open) => !open && setDeleteStepTarget(null)}
        title="Delete step"
        description={`Delete step #${deleteStepTarget?.step_number} "${deleteStepTarget?.title}"?`}
        onConfirm={() => deleteStepTarget && deleteStepMutation.mutate(deleteStepTarget.id)}
        loading={deleteStepMutation.isPending}
      />
    </div>
  );
}
