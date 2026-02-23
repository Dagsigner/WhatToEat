export function getImageUrl(photoUrl: string | null | undefined): string {
  if (!photoUrl) return "/placeholder-recipe.svg";
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
    return photoUrl;
  }
  // Относительный путь — проксируем через /uploads/
  if (photoUrl.startsWith("/uploads/")) return photoUrl;
  if (photoUrl.startsWith("uploads/")) return `/${photoUrl}`;
  return photoUrl;
}
