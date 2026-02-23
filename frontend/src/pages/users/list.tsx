import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { listUsers, deleteUser } from "@/api/users";
import type { UserAdmin } from "@/types";
import { toast } from "sonner";

export default function UsersListPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["users", page, search],
    queryFn: () => listUsers(limit, page * limit, search || undefined),
  });

  const [deleteTarget, setDeleteTarget] = useState<UserAdmin | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["users"] });
      const prev = queryClient.getQueriesData({ queryKey: ["users"] });
      queryClient.setQueriesData(
        { queryKey: ["users"] },
        (old: any) => old ? { ...old, items: old.items.filter((u: any) => u.id !== id), total: old.total - 1 } : old,
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      ctx?.prev.forEach(([key, data]: [any, any]) => queryClient.setQueryData(key, data));
      toast.error("Failed to delete user");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setDeleteTarget(null);
    },
    onSuccess: () => {
      toast.success("User deleted");
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Users" description="Manage users" />
      <Input placeholder="Search users..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="max-w-sm" />
      {isLoading ? <LoadingSpinner /> : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>TG ID</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>TG Username</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-sm">{u.tg_id}</TableCell>
                    <TableCell>{u.username ?? "—"}</TableCell>
                    <TableCell>{[u.first_name, u.last_name].filter(Boolean).join(" ") || "—"}</TableCell>
                    <TableCell>{u.tg_username ? `@${u.tg_username}` : "—"}</TableCell>
                    <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/users/${u.id}`)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(u)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {data?.items.length === 0 && (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
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
        title="Delete user"
        description={`Are you sure you want to delete user "${deleteTarget?.username ?? deleteTarget?.tg_id}"?`}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
