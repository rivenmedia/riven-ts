import { Button } from "@/components/_ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/_ui/field";
import { Input } from "@/components/_ui/input";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import z from "zod";

import { FormBase } from "../form-base/form-base";

const EmailChangeFormSchema = z.object({
  newEmail: z.email(),
});

export function EmailChangeForm() {
  const form = useForm({
    resolver: zodResolver(EmailChangeFormSchema),
  });

  const { formState } = form;

  const handleSubmit = form.handleSubmit(async (data) => {
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });
  });

  return (
    <FormProvider {...form}>
      <form
        method="POST"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        // action="?/emailChange"
      >
        <FormBase
          title="Change Email"
          description="Manage your email address associated with your account."
          content={
            <Field data-invalid={Boolean(formState.errors.newEmail)}>
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
              <FieldError errors={[formState.errors.newEmail]} />
            </Field>
          }
          footer={
            <Button
              variant="secondary"
              size="sm"
              disabled={formState.isSubmitting}
              type="submit"
            >
              {formState.isSubmitting && (
                <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
              )}
              Change Email
            </Button>
          }
        />
      </form>
    </FormProvider>
  );
}
