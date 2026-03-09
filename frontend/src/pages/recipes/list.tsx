import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Heart, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { listRecipes, deleteRecipe, toggleFeatured, syncFeatured } from "@/api/recipes";
import { listCategories } from "@/api/categories";
import type { RecipeAdmin } from "@/types";
import { toast } from "sonner";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export default function RecipesListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const limit = 20;

  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? "0");
  const sortBy = searchParams.get("sort_by") ?? undefined;
  const categoryId = searchParams.get("category_id") ?? undefined;

  const updateParams = useCallback((updates: Record<string, string | undefined>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === "") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const { data: categories } = useQuery({
    queryKey: ["categories-all"],
    queryFn: () => listCategories(100, 0),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["recipes", page, search, sortBy, categoryId],
    queryFn: () => listRecipes(limit, page * limit, search || undefined, sortBy, categoryId),
  });

  const toggleTitleSort = () => {
    const next = sortBy === "title_asc" ? "title_desc" : sortBy === "title_desc" ? undefined : "title_asc";
    updateParams({ sort_by: next, page: undefined });
  };

  const [deleteTarget, setDeleteTarget] = useState<RecipeAdmin | null>(null);

  const featuredMutation = useMutation({
    mutationFn: (id: string) => toggleFeatured(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["recipes"] });
      queryClient.setQueriesData(
        { queryKey: ["recipes"] },
        (old: any) => old ? { ...old, items: old.items.map((r: any) => r.id === id ? { ...r, is_featured: !r.is_featured } : r) } : old,
      );
    },
    onError: () => toast.error("Failed to toggle featured"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["recipes"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRecipe(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["recipes"] });
      const prev = queryClient.getQueriesData({ queryKey: ["recipes"] });
      queryClient.setQueriesData(
        { queryKey: ["recipes"] },
        (old: any) => old ? { ...old, items: old.items.filter((r: any) => r.id !== id), total: old.total - 1 } : old,
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      ctx?.prev.forEach(([key, data]: [any, any]) => queryClient.setQueryData(key, data));
      toast.error("Failed to delete recipe");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recipes"] });
      setDeleteTarget(null);
    },
    onSuccess: () => {
      toast.success("Recipe deleted");
    },
  });

  const syncMutation = useMutation({
    mutationFn: syncFeatured,
    onSuccess: (data) => toast.success(`Синхронизация завершена: добавлено ${data.added} записей`),
    onError: () => toast.error("Ошибка синхронизации"),
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Recipes"
        description="Manage recipes"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
              <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
              Sync Featured
            </Button>
            <Button onClick={() => navigate("/recipes/new")}><Plus className="mr-2 h-4 w-4" /> New Recipe</Button>
          </div>
        }
      />
      <div className="flex gap-3 items-center">
        <Input placeholder="Search recipes..." value={search} onChange={(e) => updateParams({ search: e.target.value, page: undefined })} className="max-w-sm" />
        <Select value={categoryId ?? "all"} onValueChange={(v) => updateParams({ category_id: v === "all" ? undefined : v, page: undefined })}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {categories?.items.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isLoading ? <LoadingSpinner /> : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Photo</TableHead>
                  <TableHead>
                    <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={toggleTitleSort}>
                      Title
                      {sortBy === "title_asc" ? <ArrowUp className="h-3 w-3" /> : sortBy === "title_desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 text-muted-foreground" />}
                    </button>
                  </TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Prep / Cook</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.photo_url ? (
                        <img
                          src={r.photo_url}
                          alt=""
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">—</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{r.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.difficulty}</Badge>
                    </TableCell>
                    <TableCell>{r.prep_time}m / {r.cook_time}m</TableCell>
                    <TableCell>
                      <Badge variant={r.is_active ? "default" : "secondary"}>
                        {r.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(r.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => featuredMutation.mutate(r.id)} title={r.is_featured ? "Remove from featured" : "Add to featured"}>
                          <Heart className={`h-4 w-4 ${r.is_featured ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/recipes/${r.id}/edit`)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {data?.items.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No recipes found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total: {data?.total ?? 0}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => updateParams({ page: String(page - 1) })}>Previous</Button>
              <Button variant="outline" size="sm" disabled={(data?.total ?? 0) <= (page + 1) * limit} onClick={() => updateParams({ page: String(page + 1) })}>Next</Button>
            </div>
          </div>
        </>
      )}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete recipe"
        description={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
