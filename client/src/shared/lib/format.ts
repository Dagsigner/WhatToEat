const DIFFICULTY_MAP: Record<string, string> = {
  easy: "Легко",
  medium: "Средне",
  hard: "Сложно",
};

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} ч ${m} мин` : `${h} ч`;
}

export function formatDifficulty(value: string): string {
  return DIFFICULTY_MAP[value] ?? value;
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
