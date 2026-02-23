"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { UserProfile, UserUpdateData } from "@/shared/types/user";

const schema = z.object({
  first_name: z.string().max(255).optional().or(z.literal("")),
  last_name: z.string().max(255).optional().or(z.literal("")),
  username: z.string().max(255).optional().or(z.literal("")),
  phone_number: z
    .string()
    .max(20)
    .optional()
    .or(z.literal("")),
});

type FormValues = z.infer<typeof schema>;

interface ProfileEditFormProps {
  user: UserProfile;
  onSave: (data: UserUpdateData) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function ProfileEditForm({
  user,
  onSave,
  onCancel,
  isSaving,
}: ProfileEditFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      username: user.username ?? "",
      phone_number: user.phone_number ?? "",
    },
  });

  const onSubmit = (values: FormValues) => {
    onSave({
      first_name: values.first_name || null,
      last_name: values.last_name || null,
      username: values.username || null,
      phone_number: values.phone_number || null,
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Field
        label="Имя"
        error={errors.first_name?.message}
        {...register("first_name")}
      />
      <Field
        label="Фамилия"
        error={errors.last_name?.message}
        {...register("last_name")}
      />
      <Field
        label="Username"
        error={errors.username?.message}
        {...register("username")}
      />
      <Field
        label="Телефон"
        error={errors.phone_number?.message}
        {...register("phone_number")}
      />

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-[var(--tg-theme-hint-color,#ddd)] py-3 text-sm font-medium text-[var(--tg-theme-text-color,#333)]"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="flex-1 rounded-xl bg-[var(--tg-theme-button-color,#3390ec)] py-3 text-sm font-medium text-[var(--tg-theme-button-text-color,#fff)] disabled:opacity-50"
        >
          {isSaving ? "Сохранение…" : "Сохранить"}
        </button>
      </div>
    </form>
  );
}

import { forwardRef } from "react";

interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, ...rest }, ref) => (
    <div>
      <label className="mb-1 block text-sm text-[var(--tg-theme-hint-color,#999)]">
        {label}
      </label>
      <input
        ref={ref}
        className="w-full rounded-lg border border-[var(--tg-theme-hint-color,#ddd)]/30 bg-[var(--tg-theme-secondary-bg-color,#f5f5f5)] px-3 py-2.5 text-sm text-[var(--tg-theme-text-color,#333)] outline-none focus:border-[var(--tg-theme-button-color,#3390ec)]"
        {...rest}
      />
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  ),
);

Field.displayName = "Field";
