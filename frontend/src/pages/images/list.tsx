import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, Trash2, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { listImages, deleteImage, uploadFile } from "@/api/images";
import type { ImageItem } from "@/types";
import { toast } from "sonner";

function formatBytes(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ImagesListPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["images", page],
    queryFn: () => listImages(limit, page * limit),
  });

  const [deleteTarget, setDeleteTarget] = useState<ImageItem | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteImage(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["images"] });
      const prev = queryClient.getQueriesData({ queryKey: ["images"] });
      queryClient.setQueriesData(
        { queryKey: ["images"] },
        (old: any) => old ? { ...old, items: old.items.filter((img: any) => img.id !== id), total: old.total - 1 } : old,
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      ctx?.prev.forEach(([key, data]: [any, any]) => queryClient.setQueryData(key, data));
      toast.error("Failed to delete image");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
      setDeleteTarget(null);
    },
    onSuccess: () => {
      toast.success("Image deleted");
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadFile(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["images"] });
      toast.success("Image uploaded");
    },
    onError: () => {
      toast.error("Upload failed");
    },
  });

  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = "";
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) uploadMutation.mutate(file);
  }, [uploadMutation]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Images"
        description="Manage uploaded images"
        action={
          <>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending}>
              <Upload className="mr-2 h-4 w-4" />
              {uploadMutation.isPending ? "Uploading..." : "Upload Image"}
            </Button>
          </>
        }
      />
      {isLoading ? <LoadingSpinner /> : (
        <>
          <div
            className={`rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"} ${uploadMutation.isPending ? "pointer-events-none opacity-60" : ""}`}
            onClick={() => !uploadMutation.isPending && fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
          >
            {uploadMutation.isPending ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drag & drop images here, or <span className="text-primary font-medium">click to browse</span>
                </p>
                <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, GIF up to 10 MB</p>
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {data?.items.map((img) => (
              <Card key={img.id} className="overflow-hidden">
                <div className="aspect-square bg-muted">
                  <img src={img.url} alt={img.filename ?? "image"} className="h-full w-full object-cover" />
                </div>
                <CardContent className="p-3">
                  <p className="truncate text-sm font-medium">{img.filename ?? "unnamed"}</p>
                  <p className="text-xs text-muted-foreground">
                    {img.content_type} &middot; {formatBytes(img.size)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(img.created_at).toLocaleDateString()}
                  </p>
                  <Button variant="ghost" size="sm" className="mt-2 w-full text-destructive" onClick={() => setDeleteTarget(img)}>
                    <Trash2 className="mr-2 h-3 w-3" /> Delete
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          {data?.items.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No images uploaded yet</p>
          )}
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
        title="Delete image"
        description={`Are you sure you want to delete "${deleteTarget?.filename}"?`}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
