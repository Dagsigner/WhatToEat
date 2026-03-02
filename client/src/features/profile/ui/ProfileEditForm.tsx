"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Input } from "@/shared/ui";
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
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          size="lg"
          className="flex-1 rounded-xl"
        >
          Отмена
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
          size="lg"
          className="flex-1 rounded-xl"
        >
          {isSaving ? "Сохранение…" : "Сохранить"}
        </Button>
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
      <label className="mb-1 block text-sm text-muted-foreground">
        {label}
      </label>
      <Input
        ref={ref}
        className="bg-secondary"
        {...rest}
      />
      {error && (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      )}
    </div>
  ),
);

Field.displayName = "Field";
