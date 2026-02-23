import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { listRecipes, deleteRecipe } from "@/api/recipes";
import type { RecipeAdmin } from "@/types";
import { toast } from "sonner";

export default function RecipesListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["recipes", page, search],
    queryFn: () => listRecipes(limit, page * limit, search || undefined),
  });

  const [deleteTarget, setDeleteTarget] = useState<RecipeAdmin | null>(null);

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

  return (
    <div className="space-y-4">
      <PageHeader
        title="Recipes"
        description="Manage recipes"
        action={<Button onClick={() => navigate("/recipes/new")}><Plus className="mr-2 h-4 w-4" /> New Recipe</Button>}
      />
      <Input placeholder="Search recipes..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="max-w-sm" />
      {isLoading ? <LoadingSpinner /> : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-14">Photo</TableHead>
                  <TableHead>Title</TableHead>
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
                          src={r.photo_url.startsWith("http") ? r.photo_url : `http://localhost:8000${r.photo_url}`}
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
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="outline" size="sm" disabled={(data?.total ?? 0) <= (page + 1) * limit} onClick={() => setPage(page + 1)}>Next</Button>
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
