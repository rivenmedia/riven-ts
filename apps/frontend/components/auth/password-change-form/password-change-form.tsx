import { Button } from "@/components/_ui/button";
import { ButtonGroup } from "@/components/_ui/button-group";
import { Field, FieldError, FieldLabel } from "@/components/_ui/field";
import { Input } from "@/components/_ui/input";
import { Switch } from "@/components/_ui/switch";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormBase } from "../form-base/form-base";
import { PasswordChangeFormSchema } from "./password-change.form-schema";

import type { PasswordChangeFormValues } from "./password-change.form-schema";
import type { UseFormRegisterReturn } from "react-hook-form";

export function PasswordChangeForm() {
  const form = useForm({
    resolver: zodResolver(PasswordChangeFormSchema),
    defaultValues: {
      confirmNewPassword: "",
      currentPassword: "",
      newPassword: "",
      revokeSessions: false,
    },
  });

  const handleSubmit = form.handleSubmit((_data) => {
    // TODO: Implement password change logic here

    toast.success("Password changed successfully!");
  });

  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
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
      keyof PasswordChangeFormValues,
      "currentPassword" | "newPassword" | "confirmNewPassword"
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
            aria-invalid={Boolean(form.formState.errors[name])}
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

  const revokeSessionsId = useId();

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      // method="POST"
      // action="?/passwordChange"
    >
      <FormBase
        title="Change Password"
        description="Update your account password to keep your account secure"
        content={
          <>
            {renderPasswordField(
              "currentPassword",
              "Current Password",
              form.register("currentPassword", { deps: "newPassword" }),
            )}
            {renderPasswordField(
              "newPassword",
              "New Password",
              form.register("newPassword", { deps: "currentPassword" }),
            )}
            {renderPasswordField(
              "confirmNewPassword",
              "Confirm New Password",
              form.register("confirmNewPassword", { deps: "newPassword" }),
            )}
            <Field className="mt-4">
              <div className="flex items-center gap-2">
                <Switch
                  {...form.register("revokeSessions")}
                  id={revokeSessionsId}
                  onCheckedChange={(checked) => {
                    form.setValue("revokeSessions", checked);
                  }}
                />
                <FieldLabel htmlFor={revokeSessionsId}>
                  Revoke all other sessions
                </FieldLabel>
              </div>
              <FieldError errors={[form.formState.errors.revokeSessions]} />
            </Field>
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
            Change Password
          </Button>
        }
      />
    </form>
  );
}
