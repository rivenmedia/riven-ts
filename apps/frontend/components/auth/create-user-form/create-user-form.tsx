"use client";

import { UserRole } from "@repo/util-auth/access-control";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { startCase } from "es-toolkit";
import { LoaderCircle } from "lucide-react";
import { useId } from "react";
import { toast } from "sonner";

import { Button } from "#components/_ui/button.tsx";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "#components/_ui/field.tsx";
import { Input } from "#components/_ui/input.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "#components/_ui/select.tsx";
import { FormBase } from "#components/auth/form-base/form-base.tsx";

import { createUser } from "./create-user.action.ts";
import { CreateUserFormSchema } from "./create-user.form-schema.ts";

/**
 * Admin form for creating a new user with a username, email, password and role.
 */
export function CreateUserForm() {
  const { form, handleSubmitWithAction } = useHookFormAction(
    createUser,
    zodResolver(CreateUserFormSchema),
    {
      actionProps: {
        onSuccess() {
          form.reset();

          toast.success(`User created successfully!`);
        },
      },
    },
  );

  const {
    formState: { errors, isSubmitting, isDirty },
  } = form;

  const usernameInputId = useId();
  const emailInputId = useId();
  const passwordInputId = useId();
  const confirmPasswordInputId = useId();
  const roleInputId = useId();

  return (
    <form onSubmit={(event) => void handleSubmitWithAction(event)}>
      <FormBase
        title="Create User"
        description="Create a new user with the given role"
        content={
          <div className="grid max-w-2xl gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel htmlFor={usernameInputId}>Username</FieldLabel>
              <Input
                placeholder="Enter a username"
                id={usernameInputId}
                {...form.register("username", { required: true })}
              />
              <FieldError errors={[errors.username]} />
            </Field>
            <Field>
              <FieldLabel htmlFor={emailInputId}>Email</FieldLabel>
              <Input
                type="email"
                placeholder="user@example.com"
                id={emailInputId}
                {...form.register("email", { required: true })}
              />
              <FieldError errors={[errors.email]} />
            </Field>
            <Field>
              <FieldLabel htmlFor={passwordInputId}>Password</FieldLabel>
              <Input
                type="password"
                autoComplete="new-password"
                id={passwordInputId}
                placeholder="Enter a password"
                {...form.register("password", { required: true })}
              />
              <FieldError errors={[errors.password]} />
            </Field>
            <Field>
              <FieldLabel htmlFor={confirmPasswordInputId}>
                Confirm Password
              </FieldLabel>
              <Input
                type="password"
                autoComplete="new-password"
                placeholder="Confirm your password"
                id={confirmPasswordInputId}
                {...form.register("confirmPassword", { required: true })}
              />
              <FieldError errors={[errors.confirmPassword]} />
            </Field>
            <Field>
              <FieldLabel htmlFor={roleInputId}>Role</FieldLabel>
              <Select
                {...form.register("role")}
                required
                onValueChange={(value: UserRole) => {
                  form.setValue("role", value);
                }}
              >
                <SelectTrigger id={roleInputId}>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {UserRole.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {startCase(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldDescription>
                Managers can maintain the library. Admins can also access
                settings and users.
              </FieldDescription>
              <FieldError errors={[errors.role]} />
            </Field>
          </div>
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
            Create user
          </Button>
        }
      />
    </form>
  );
}
