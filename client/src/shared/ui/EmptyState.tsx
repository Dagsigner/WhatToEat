"use client";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
}

export function EmptyState({ icon = "📭", title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <span className="text-4xl">{icon}</span>
      <p className="mt-3 text-base font-medium text-[var(--tg-theme-text-color,#333)]">
        {title}
      </p>
      {description && (
        <p className="mt-1 text-sm text-[var(--tg-theme-hint-color,#999)]">
          {description}
        </p>
      )}
    </div>
  );
}
