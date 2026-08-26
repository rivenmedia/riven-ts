import { Button } from "@/components/_ui/button";
import { ButtonGroup } from "@/components/_ui/button-group";
import { Field, FieldError, FieldLabel } from "@/components/_ui/field";
import { Input } from "@/components/_ui/input";

import { zodResolver } from "@hookform/resolvers/zod";
import { delay } from "es-toolkit";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormBase } from "../form-base/form-base";
import { SetPasswordFormSchema } from "./set-password-form-schema";

import type { SetPasswordFormValues } from "./set-password-form-schema";
import type { UseFormRegisterReturn } from "react-hook-form";

export function SetPasswordForm() {
  const form = useForm({
    resolver: zodResolver(SetPasswordFormSchema),
    defaultValues: {
      confirmNewPassword: "",
      newPassword: "",
    },
  });

  const handleSubmit = form.handleSubmit(async (_data) => {
    // TODO: Implement password change logic here

    await delay(1000);

    toast.success("Password set successfully!");
  });

  const [passwordVisibility, setPasswordVisibility] = useState({
    newPassword: false,
    confirmNewPassword: false,
  });

  function togglePasswordVisibility(field: keyof typeof passwordVisibility) {
    setPasswordVisibility((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }

  function renderPasswordField(
    name: Extract<
      keyof SetPasswordFormValues,
      "newPassword" | "confirmNewPassword"
    >,
    label: string,
    register: UseFormRegisterReturn,
  ) {
    return (
      <Field data-invalid={Boolean(form.formState.errors[name])}>
        <FieldLabel htmlFor={name}>{label}</FieldLabel>
        <ButtonGroup className="w-full">
          <Input
            {...register}
            id={name}
            type={passwordVisibility[name] ? "text" : "password"}
          />
          <Button
            onClick={() => {
              togglePasswordVisibility(name);
            }}
            variant="outline"
            size="icon"
            aria-label="toggle password visibility"
            type="button"
          >
            {passwordVisibility[name] ? <EyeOff /> : <Eye />}
          </Button>
        </ButtonGroup>
        <FieldError errors={[form.formState.errors[name]]} />
      </Field>
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      // method="POST"
      // action="?/passwordChange"
    >
      <FormBase
        title="Set Password"
        description="Update your user profile information including username, name, and avatar."
        content={
          <>
            {renderPasswordField(
              "newPassword",
              "New Password",
              form.register("newPassword"),
            )}
            {renderPasswordField(
              "confirmNewPassword",
              "Confirm New Password",
              form.register("confirmNewPassword", { deps: "newPassword" }),
            )}
          </>
        }
        footer={
          <Button
            variant="secondary"
            size="sm"
            disabled={!form.formState.isDirty || form.formState.isSubmitting}
            type="submit"
          >
            {form.formState.isSubmitting && (
              <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
            )}
            Set Password
          </Button>
        }
      />
    </form>
  );
}
