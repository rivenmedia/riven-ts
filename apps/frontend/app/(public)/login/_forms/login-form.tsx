"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth/client";
import { createScopedLogger } from "@/lib/logger";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { useEffect } from "react";
import { Controller } from "react-hook-form";

import { loginUser } from "../_actions/login.action";
import { OAuthProviders } from "../_components/oauth-providers";
import { loginSchema } from "../_form-schemas/login.schema";

import type { AuthProvider } from "@/app/_types/__generated__/graphql";

const logger = createScopedLogger("login");

function handleSuccessfulSignin() {
  globalThis.window.history.replaceState(null, "", "/");
}

interface LoginFormProps {
  authProviders: AuthProvider[];
  isCredentialProviderEnabled: boolean;
  lastLoginMethod: string | null;
}

export function LoginForm({
  authProviders,
  isCredentialProviderEnabled,
  lastLoginMethod,
}: LoginFormProps) {
  useEffect(() => {
    async function maybeAutoPasskeySignIn() {
      if (
        typeof globalThis.window.PublicKeyCredential
          .isConditionalMediationAvailable === "function"
      ) {
        const supportsPasskeyAutofill =
          await globalThis.window.PublicKeyCredential.isConditionalMediationAvailable();

        if (supportsPasskeyAutofill) {
          void authClient.signIn.passkey({
            autoFill: true,
            fetchOptions: {
              onSuccess: handleSuccessfulSignin,
              onError(context) {
                logger.debug("Passkey autofill failed:", context.error);
              },
            },
          });
        }
      }
    }

    void maybeAutoPasskeySignIn();
  }, []);

  const { form, handleSubmitWithAction } = useHookFormAction(
    loginUser.bind(null, { isCredentialProviderEnabled }),
    zodResolver(loginSchema),
    {
      formProps: {
        defaultValues: {
          password: "",
          username: "",
        },
      },
    },
  );

  const { control } = form;

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your username below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isCredentialProviderEnabled && (
          <>
            <form onSubmit={(event) => void handleSubmitWithAction(event)}>
              <Controller
                control={control}
                name="username"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      autoComplete="username webauthn"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={control}
                name="password"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      autoComplete="current-password webauthn"
                      type="password"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Button className="mt-4 w-full">Submit</Button>
            </form>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card text-muted-foreground px-2">
                  Or continue with
                </span>
              </div>
            </div>
          </>
        )}
        <OAuthProviders
          authProviders={authProviders}
          onSignIn={handleSuccessfulSignin}
          lastLoginMethod={lastLoginMethod}
        />
      </CardContent>
    </Card>
  );
}
