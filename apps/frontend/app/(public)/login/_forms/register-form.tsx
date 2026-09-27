"use client";

import { Button } from "@/components/_ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/_ui/card";
import { Field, FieldError, FieldLabel } from "@/components/_ui/field";
import { Input } from "@/components/_ui/input";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { useId } from "react";
import { toast } from "sonner";

import { registerUser } from "../_actions/register.action";
import { registerSchema } from "../_form-schemas/register.schema";

interface RegisterFormProps {
  isSignupEnabled: boolean;
}

export function RegisterForm({ isSignupEnabled }: RegisterFormProps) {
  const { form, action } = useHookFormAction(
    registerUser.bind(null, {
      isSignupEnabled,
    }),
    zodResolver(registerSchema),
    {
      formProps: {
        defaultValues: {
          confirmPassword: "",
          email: "",
          image: "",
          password: "",
          username: "",
        },
      },
      actionProps: {
        onNavigation({ navigationKind }) {
          if (navigationKind === "redirect") {
            toast.success("Registration successful");
          }
        },
        onError() {
          toast.error("An error occurred during registration");
        },
      },
    },
  );

  const handleSubmit = form.handleSubmit((data) => {
    // Use action.execute to prevent redirects from surfacing as uncaught exceptions
    action.execute(data);
  });

  const { errors } = form.formState;

  const usernameInputId = useId();
  const emailInputId = useId();
  const imageInputId = useId();
  const passwordInputId = useId();
  const confirmPasswordInputId = useId();

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Register</CardTitle>
        <CardDescription>
          Enter your details below to create a new account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-2"
          onSubmit={(event) => void handleSubmit(event)}
        >
          <Field data-invalid={Boolean(errors.username)}>
            <FieldLabel htmlFor={usernameInputId}>Username</FieldLabel>
            <Input
              {...form.register("username", { required: true })}
              id={usernameInputId}
              aria-invalid={Boolean(errors.username)}
            />
            {errors.username && <FieldError errors={[errors.username]} />}
          </Field>
          <Field data-invalid={Boolean(errors.email)}>
            <FieldLabel htmlFor={emailInputId}>Email</FieldLabel>
            <Input
              {...form.register("email", { required: true })}
              id={emailInputId}
              aria-invalid={Boolean(errors.email)}
              type="email"
            />
            {errors.email && <FieldError errors={[errors.email]} />}
          </Field>
          <Field data-invalid={Boolean(errors.image)}>
            <FieldLabel htmlFor={imageInputId}>Image</FieldLabel>
            <Input
              {...form.register("image")}
              id={imageInputId}
              aria-invalid={Boolean(errors.image)}
            />
            {errors.image && <FieldError errors={[errors.image]} />}
          </Field>
          <Field data-invalid={Boolean(errors.password)}>
            <FieldLabel htmlFor={passwordInputId}>Password</FieldLabel>
            <Input
              {...form.register("password", { required: true })}
              id={passwordInputId}
              aria-invalid={Boolean(errors.password)}
              type="password"
            />
            {errors.password && <FieldError errors={[errors.password]} />}
          </Field>
          <Field data-invalid={Boolean(errors.confirmPassword)}>
            <FieldLabel htmlFor={confirmPasswordInputId}>
              Confirm Password
            </FieldLabel>
            <Input
              {...form.register("confirmPassword", { required: true })}
              id={confirmPasswordInputId}
              aria-invalid={Boolean(errors.confirmPassword)}
              type="password"
            />
            {errors.confirmPassword && (
              <FieldError errors={[errors.confirmPassword]} />
            )}
          </Field>
          <Button type="submit" className="mt-2">
            Submit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
