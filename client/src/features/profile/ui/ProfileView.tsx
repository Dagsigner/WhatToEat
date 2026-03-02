"use client";

import { formatDate } from "@/shared/lib/format";
import { Button } from "@/shared/ui";
import type { UserProfile } from "@/shared/types/user";

interface ProfileViewProps {
  user: UserProfile;
  onEdit: () => void;
}

export function ProfileView({ user, onEdit }: ProfileViewProps) {
  const displayName = [user.first_name, user.last_name]
    .filter(Boolean)
    .join(" ") || user.tg_username || "Пользователь";

  return (
    <div className="space-y-4">
      {/* Аватар и имя */}
      <div className="flex flex-col items-center gap-2 pt-4">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-3xl text-primary-foreground">
          {(user.first_name?.[0] || user.tg_username?.[0] || "?").toUpperCase()}
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          {displayName}
        </h2>
        {user.tg_username && (
          <p className="text-sm text-muted-foreground">
            @{user.tg_username}
          </p>
        )}
      </div>

      {/* Информация */}
      <div className="space-y-3 rounded-xl bg-secondary p-4">
        <InfoRow label="Имя" value={user.first_name} />
        <InfoRow label="Фамилия" value={user.last_name} />
        <InfoRow label="Username" value={user.username} />
        <InfoRow label="Телефон" value={user.phone_number} />
        <InfoRow label="Дата регистрации" value={formatDate(user.created_at)} />
      </div>

      {/* Кнопка редактирования */}
      <Button
        type="button"
        onClick={onEdit}
        className="w-full rounded-xl"
        size="lg"
      >
        Редактировать
      </Button>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">
        {label}
      </span>
      <span className="text-sm text-foreground">
        {value || "—"}
      </span>
    </div>
  );
}
