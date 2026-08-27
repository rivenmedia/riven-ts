import { Button } from "@/components/_ui/button";
import { Field, FieldError, FieldLabel } from "@/components/_ui/field";
import { Input } from "@/components/_ui/input";

import { zodResolver } from "@hookform/resolvers/zod";
import { delay } from "es-toolkit";
import { LoaderCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormBase } from "../form-base/form-base";
import { UpdateProfileFormSchema } from "./update-profile.form-schema";

import type { UpdateProfileFormValues } from "./update-profile.form-schema";

interface UpdateProfileFormProps {
  data: UpdateProfileFormValues;
}

export function UpdateProfileForm({ data }: UpdateProfileFormProps) {
  const form = useForm({
    resolver: zodResolver(UpdateProfileFormSchema),
    defaultValues: data,
  });

  const {
    formState: { isSubmitting },
  } = form;

  function renderField(
    name: keyof UpdateProfileFormValues,
    label: string,
    inputProps?: React.ComponentProps<typeof Input>,
  ) {
    return (
      <Field data-invalid={Boolean(form.formState.errors[name])}>
        <div>
          <FieldLabel htmlFor={name} className="mb-1">
            {label}
          </FieldLabel>
          <Input {...inputProps} id={name} />
        </div>
        <FieldError errors={[form.formState.errors[name]]} />
      </Field>
    );
  }

  const handleSubmit = form.handleSubmit(async (_data) => {
    await delay(100);

    toast.success("Profile updated successfully!");
  });

  return (
    <form
      aria-labelledby="update-profile-form-title"
      onSubmit={(event) => void handleSubmit(event)}
    >
      <FormBase
        title="Update Profile"
        description="Update your user profile information including username, name, and avatar."
        content={
          <div className="flex flex-col gap-2">
            {renderField("username", "Username", {
              ...form.register("username"),
              placeholder: "Enter your username",
              disabled: isSubmitting,
            })}
            {renderField("name", "Name", {
              ...form.register("name"),
              placeholder: "Enter your name",
              disabled: isSubmitting,
            })}
            {renderField("avatar", "Avatar", {
              ...form.register("avatar"),
              placeholder: "Enter your avatar URL",
              disabled: isSubmitting,
            })}
          </div>
        }
        footer={
          <Button variant="secondary" size="sm" disabled={isSubmitting}>
            {isSubmitting && (
              <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
            )}
            Update profile
          </Button>
        }
      />
    </form>
  );
}
