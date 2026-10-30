"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { use, useEffect, useId } from "react";
import { browser } from "react-dom";
import { toast } from "sonner";

import { loginUser } from "#app/(public)/login/_actions/login.action.ts";
import { OAuthProviders } from "#app/(public)/login/_components/oauth-providers.tsx";
import { loginSchema } from "#app/(public)/login/_form-schemas/login.schema.ts";
import { browserSupportsPasskeys } from "#app/(public)/login/_utils/browser-supports-passkeys.ts";
import { Button } from "#components/_ui/button.tsx";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "#components/_ui/card.tsx";
import { Field, FieldError, FieldLabel } from "#components/_ui/field.tsx";
import { Input } from "#components/_ui/input.tsx";
import { authClient } from "#lib/auth/client.ts";
import { createScopedLogger } from "#lib/logger.ts";

import type { AuthProvider } from "#app/_types/__generated__/graphql.ts";

const logger = createScopedLogger("login");

function handleSuccessfulSignin() {
  globalThis.window.history.replaceState(null, "", "/");
}

interface LoginFormProps {
  authProviders: AuthProvider[];
  isCredentialLoginEnabled: boolean;
  lastLoginMethod: string | null;
}

export function LoginForm({
  authProviders,
  isCredentialLoginEnabled,
  lastLoginMethod,
}: LoginFormProps) {
  useEffect(() => {
    use(browser());

    async function maybeAutoPasskeySignIn() {
      if (browserSupportsPasskeys(globalThis.window)) {
        const supportsPasskeyAutofill =
          await globalThis.window.PublicKeyCredential.isConditionalMediationAvailable();

        if (supportsPasskeyAutofill) {
          try {
            await authClient.signIn.passkey({
              autoFill: true,
              fetchOptions: { throw: true },
            });

            handleSuccessfulSignin();
          } catch (error) {
            logger.debug("Passkey autofill encountered an error:", error);
          }
        }
      }
    }

    void maybeAutoPasskeySignIn();
  }, []);

  const { form, action } = useHookFormAction(
    loginUser.bind(null, { isCredentialLoginEnabled }),
    zodResolver(loginSchema),
    {
      formProps: {
        defaultValues: {
          password: "",
          username: "",
        },
        progressive: true,
      },
      actionProps: {
        onNavigation({ navigationKind }) {
          if (navigationKind === "redirect") {
            toast.success("Login successful");
          }
        },
        onError() {
          toast.error("An error occurred during login");
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
  const passwordInputId = useId();

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your username below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isCredentialLoginEnabled && (
          <>
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
                  autoComplete="username webauthn"
                />
                {errors.username && <FieldError errors={[errors.username]} />}
              </Field>
              <Field data-invalid={Boolean(errors.password)}>
                <FieldLabel htmlFor={passwordInputId}>Password</FieldLabel>
                <Input
                  {...form.register("password", { required: true })}
                  id={passwordInputId}
                  aria-invalid={Boolean(errors.password)}
                  autoComplete="current-password webauthn"
                  type="password"
                />
                {errors.password && <FieldError errors={[errors.password]} />}
              </Field>
              <Button className="mt-2 w-full" type="submit">
                Submit
              </Button>
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
