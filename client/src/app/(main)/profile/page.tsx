"use client";

import { useState } from "react";
import {
  useProfile,
  useUpdateProfile,
  ProfileView,
  ProfileEditForm,
} from "@/features/profile";
import { Spinner } from "@/shared/ui";
import type { UserUpdateData } from "@/shared/types/user";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const { data: user, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const handleSave = (data: UserUpdateData) => {
    updateProfile.mutate(data, {
      onSuccess: () => setIsEditing(false),
    });
  };

  if (isLoading || !user) {
    return <Spinner className="pt-20" />;
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-xl font-semibold text-[var(--tg-theme-text-color,#333)]">
        Профиль
      </h1>
      {isEditing ? (
        <ProfileEditForm
          user={user}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          isSaving={updateProfile.isPending}
        />
      ) : (
        <ProfileView user={user} onEdit={() => setIsEditing(true)} />
      )}
    </div>
  );
}
