import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { listCategories, deleteCategory } from "@/api/categories";
import type { CategoryAdmin } from "@/types";
import { CategoryFormDialog } from "./form";
import { toast } from "sonner";

export default function CategoriesListPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["categories", page, search],
    queryFn: () => listCategories(limit, page * limit, search || undefined),
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editItem, setEditItem] = useState<CategoryAdmin | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CategoryAdmin | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["categories"] });
      const prev = queryClient.getQueriesData({ queryKey: ["categories"] });
      queryClient.setQueriesData(
        { queryKey: ["categories"] },
        (old: any) => old ? { ...old, items: old.items.filter((c: any) => c.id !== id), total: old.total - 1 } : old,
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      ctx?.prev.forEach(([key, data]: [any, any]) => queryClient.setQueryData(key, data));
      toast.error("Failed to delete category");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeleteTarget(null);
    },
    onSuccess: () => {
      toast.success("Category deleted");
    },
  });

  const openCreate = () => {
    setEditItem(null);
    setFormOpen(true);
  };
  const openEdit = (item: CategoryAdmin) => {
    setEditItem(item);
    setFormOpen(true);
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Categories"
        description="Manage recipe categories"
        action={
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" /> New Category
          </Button>
        }
      />

      <Input
        placeholder="Search categories..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        className="max-w-sm"
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((cat) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.title}</TableCell>
                    <TableCell className="text-muted-foreground">{cat.slug}</TableCell>
                    <TableCell>
                      <Badge variant={cat.is_active ? "default" : "secondary"}>
                        {cat.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(cat.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(cat)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(cat)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {data?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No categories found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Total: {data?.total ?? 0}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={(data?.total ?? 0) <= (page + 1) * limit}
                onClick={() => setPage(page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete category"
        description={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
