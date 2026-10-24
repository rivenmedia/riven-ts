"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { LoaderCircle } from "lucide-react";
import { useId } from "react";
import { FormProvider } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "#components/_ui/button.tsx";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#components/_ui/field.tsx";
import { Switch } from "#components/_ui/switch.tsx";
import { FormBase } from "#components/auth/form-base/form-base.tsx";

import { ToggleablePasswordField } from "../_components/toggleable-password-field.tsx";
import { changePassword } from "./change-password.action.ts";
import { PasswordChangeFormSchema } from "./password-change.form-schema.ts";

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

  const revokeOtherSessionsId = useId();

  return (
    <FormProvider {...form}>
      <form onSubmit={(event) => void handleSubmitWithAction(event)}>
        <FormBase
          title="Change Password"
          description="Update your account password to keep your account secure"
          content={
            <FieldGroup>
              <ToggleablePasswordField
                name="currentPassword"
                label="Current Password"
                field={form.register("currentPassword", {
                  deps: "newPassword",
                })}
              />
              <ToggleablePasswordField
                name="newPassword"
                label="New Password"
                field={form.register("newPassword", {
                  deps: "currentPassword",
                })}
              />
              <ToggleablePasswordField
                name="confirmNewPassword"
                label="Confirm New Password"
                field={form.register("confirmNewPassword", {
                  deps: "newPassword",
                })}
              />
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
    </FormProvider>
  );
}
