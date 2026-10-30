"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "#components/_ui/button.tsx";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "#components/_ui/field.tsx";
import { Input } from "#components/_ui/input.tsx";
import { FormBase } from "#components/auth/form-base/form-base.tsx";

import { changeEmail } from "./change-email.action";
import { ChangeEmailFormSchema } from "./change-email.form-schema";

/** Form for changing the email address on the current user's account. */
export function ChangeEmailForm() {
  const { form, handleSubmitWithAction } = useHookFormAction(
    changeEmail,
    zodResolver(ChangeEmailFormSchema),
    {
      actionProps: {
        onError: ({ error }) => {
          toast.error(error.serverError);
        },
        onSuccess: () => {
          toast.success("Email changed successfully");
        },
      },
    },
  );

  const {
    formState: { errors, isDirty, isSubmitting },
  } = form;

  return (
    <form
      method="POST"
      onSubmit={(event) => {
        void handleSubmitWithAction(event);
      }}
    >
      <FormBase
        title="Change Email"
        description="Manage your email address associated with your account."
        content={
          <Field data-invalid={Boolean(errors.newEmail)}>
            <FieldLabel className="flex-col items-start">
              New Email
              <FieldContent className="w-full">
                <Input
                  {...form.register("newEmail")}
                  type="email"
                  placeholder="Your new email address"
                  required
                />
              </FieldContent>
            </FieldLabel>
            <FieldError errors={[errors.newEmail]} />
          </Field>
        }
        footer={
          <Button
            variant="secondary"
            size="sm"
            disabled={!isDirty || isSubmitting}
            type="submit"
          >
            {isSubmitting && (
              <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
            )}
            Change Email
          </Button>
        }
      />
    </form>
  );
}
