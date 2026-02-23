import { useCallback, useRef, useState } from "react";
import { Upload, X, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadFile } from "@/api/images";
import { toast } from "sonner";

const API_BASE = "http://localhost:8000";
const ACCEPTED = "image/jpeg,image/png,image/webp,image/gif";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    if (file.size > MAX_SIZE) {
      toast.error("File too large (max 10 MB)");
      return;
    }

    setUploading(true);
    try {
      const result = await uploadFile(file);
      onChange(result.url);
      toast.success("Photo uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }, [handleFile]);

  const previewUrl = value
    ? value.startsWith("http") ? value : `${API_BASE}${value}`
    : null;

  return (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium">{label}</p>}

      {previewUrl ? (
        <div className="relative group rounded-lg overflow-hidden border bg-muted">
          <img
            src={previewUrl}
            alt="Preview"
            className="w-full h-48 object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button" size="sm" variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
              Replace
            </Button>
            <Button
              type="button" size="sm" variant="destructive"
              onClick={() => onChange("")}
            >
              <X className="h-4 w-4 mr-1" /> Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={`
            relative rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors
            ${dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
            ${uploading ? "pointer-events-none opacity-60" : ""}
          `}
          onClick={() => !uploading && inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Drag & drop an image here, or <span className="text-primary font-medium">click to browse</span>
              </p>
              <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, GIF up to 10 MB</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={onFileSelect}
      />

      <Input
        placeholder="Or paste image URL..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs"
      />
    </div>
  );
}
