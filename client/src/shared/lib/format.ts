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

export function formatRelativeDay(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  if (diffDays === 2) return "Позавчера";

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}
