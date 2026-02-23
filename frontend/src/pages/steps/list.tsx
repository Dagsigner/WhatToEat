import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { listSteps, deleteStep } from "@/api/steps";
import { listRecipes } from "@/api/recipes";
import type { StepAdmin } from "@/types";
import { StepFormDialog } from "./form";
import { toast } from "sonner";

export default function StepsListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [recipeFilter, setRecipeFilter] = useState<string>("");
  const limit = 20;

  const { data: recipesData } = useQuery({
    queryKey: ["recipes", "all-for-steps"],
    queryFn: () => listRecipes(100, 0),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["steps", page, recipeFilter || null],
    queryFn: () => listSteps(limit, page * limit, recipeFilter || undefined),
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<StepAdmin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StepAdmin | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStep(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["steps"] });
      const prev = queryClient.getQueriesData({ queryKey: ["steps"] });
      queryClient.setQueriesData(
        { queryKey: ["steps"] },
        (old: any) => old ? { ...old, items: old.items.filter((s: any) => s.id !== id), total: old.total - 1 } : old,
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      ctx?.prev.forEach(([key, data]: [any, any]) => queryClient.setQueryData(key, data));
      toast.error("Failed to delete step");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["steps"] });
      setDeleteTarget(null);
    },
    onSuccess: () => {
      toast.success("Step deleted");
    },
  });

  const openCreate = () => { setEditItem(null); setFormOpen(true); };
  const openEdit = (item: StepAdmin) => { setEditItem(item); setFormOpen(true); };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Steps"
        description="Manage recipe steps"
        action={<Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> New Step</Button>}
      />
      <div className="flex items-center gap-4">
        <Select value={recipeFilter || "all"} onValueChange={(v) => { setRecipeFilter(v === "all" ? "" : v); setPage(0); }}>
          <SelectTrigger className="w-[240px]">
            <SelectValue placeholder="Все рецепты" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все рецепты</SelectItem>
            {recipesData?.items.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.title}</SelectItem>
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
                  <TableHead>#</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Recipe ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((step) => (
                  <TableRow key={step.id}>
                    <TableCell className="font-mono">{step.step_number}</TableCell>
                    <TableCell className="font-medium">{step.title}</TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground truncate max-w-[180px]">
                      {step.recipe_id}
                    </TableCell>
                    <TableCell>
                      <Badge variant={step.is_active ? "default" : "secondary"}>
                        {step.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(step.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(step)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(step)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {data?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No steps found
                    </TableCell>
                  </TableRow>
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
      <StepFormDialog open={formOpen} onOpenChange={setFormOpen} editItem={editItem} />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete step"
        description={`Are you sure you want to delete step "${deleteTarget?.title}"?`}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
