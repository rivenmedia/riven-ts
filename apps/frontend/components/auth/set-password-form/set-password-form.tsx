"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { LoaderCircle } from "lucide-react";
import { FormProvider } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "#components/_ui/button.tsx";
import { FormBase } from "#components/auth/form-base/form-base.tsx";

import { ToggleablePasswordField } from "../_components/toggleable-password-field.tsx";
import { setPassword } from "./_actions/set-password.action.ts";
import { SetPasswordFormSchema } from "./set-password.form-schema.ts";

/**
 * Form for setting a password on an account that doesn't have one yet (e.g. an
 * OAuth-only account).
 */
export function SetPasswordForm() {
  const { form, handleSubmitWithAction } = useHookFormAction(
    setPassword,
    zodResolver(SetPasswordFormSchema),
    {
      actionProps: {
        onSuccess() {
          toast.success("Password set successfully!");
        },
      },
      formProps: {
        defaultValues: {
          confirmNewPassword: "",
          newPassword: "",
        },
      },
    },
  );

  return (
    <FormProvider {...form}>
      <form onSubmit={(event) => void handleSubmitWithAction(event)}>
        <FormBase
          title="Set Password"
          description="Update your user profile information including username, name, and avatar."
          content={
            <>
              <ToggleablePasswordField
                name="newPassword"
                label="New Password"
                field={form.register("newPassword")}
              />
              <ToggleablePasswordField
                name="confirmNewPassword"
                label="Confirm New Password"
                field={form.register("confirmNewPassword", {
                  deps: "newPassword",
                })}
              />
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
    </FormProvider>
  );
}
