import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { useId, useState } from "react";
import { toast } from "sonner";

import { ButtonGroup } from "#components/_ui/button-group.tsx";
import { Button } from "#components/_ui/button.tsx";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#components/_ui/field.tsx";
import { Input } from "#components/_ui/input.tsx";
import { Switch } from "#components/_ui/switch.tsx";
import { FormBase } from "#components/auth/form-base/form-base.tsx";

import { changePassword } from "./change-password.action.ts";
import { PasswordChangeFormSchema } from "./password-change.form-schema.ts";

import type { PasswordChangeFormValues } from "./password-change.form-schema.ts";
import type { UseFormRegisterReturn } from "react-hook-form";

/**
 * Form for changing the current password, with visibility toggles and an option
 * to revoke other sessions.
 */
export function PasswordChangeForm() {
  const { form, handleSubmitWithAction } = useHookFormAction(
    changePassword,
    zodResolver(PasswordChangeFormSchema),
    {
      actionProps: {
        onError({ error }) {
          toast.error(error.serverError);
        },
        onSuccess() {
          toast.success("Password changed successfully!");
        },
      },
      formProps: {
        defaultValues: {
          confirmNewPassword: "",
          currentPassword: "",
          newPassword: "",
          revokeOtherSessions: false,
        },
      },
    },
  );

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
            tabIndex={-1}
          >
            {passwordVisibility[name] ? <EyeOff /> : <Eye />}
          </Button>
        </ButtonGroup>
        <FieldError errors={[form.formState.errors[name]]} />
      </Field>
    );
  }

  const revokeOtherSessionsId = useId();

  return (
    <form onSubmit={(event) => void handleSubmitWithAction(event)}>
      <FormBase
        title="Change Password"
        description="Update your account password to keep your account secure"
        content={
          <FieldGroup>
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
            <Field>
              <div className="flex items-center gap-2">
                <Switch
                  {...form.register("revokeOtherSessions")}
                  id={revokeOtherSessionsId}
                  onCheckedChange={(checked) => {
                    form.setValue("revokeOtherSessions", checked);
                  }}
                />
                <FieldLabel htmlFor={revokeOtherSessionsId}>
                  Revoke all other sessions
                </FieldLabel>
              </div>
              <FieldError
                errors={[form.formState.errors.revokeOtherSessions]}
              />
            </Field>
          </FieldGroup>
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
