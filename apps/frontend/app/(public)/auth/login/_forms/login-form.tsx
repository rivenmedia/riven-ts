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
import { authClient } from "@/lib/auth-client";
import { doesBrowserSupportPasskeys } from "@/lib/auth/passkeys";
import { createScopedLogger } from "@/lib/logger";

import { zodResolver } from "@hookform/resolvers/zod";
import { Fingerprint, StarIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { loginSchema } from "../_form-schemas/login.schema";

import type { AuthProvider } from "@/lib/auth";

const logger = createScopedLogger("login");

interface LoginFormProps {
  authProviders: Record<string, AuthProvider>;
  supportsPasskey: boolean;
  lastLoginMethod: string | null;
}

export const LoginForm = ({
  authProviders,
  supportsPasskey,
  lastLoginMethod,
}: LoginFormProps) => {
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);

  useEffect(() => {
    async function maybeAutoPasskeySignIn() {
      if (
        doesBrowserSupportPasskeys() &&
        typeof window.PublicKeyCredential.isConditionalMediationAvailable ===
          "function"
      ) {
        const supportsPasskeyAutofill =
          await window.PublicKeyCredential.isConditionalMediationAvailable();

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

  function handleSuccessfulSignin() {
    window.history.replaceState(null, "", "/");
  }

  async function handlePasskeySignIn() {
    setIsPasskeyLoading(true);

    try {
      await authClient.signIn.passkey({
        fetchOptions: {
          onSuccess: handleSuccessfulSignin,
          onError(context) {
            toast.error(
              context.error.message || "Passkey authentication failed",
            );
          },
        },
      });
    } catch {
      toast.error("Passkey authentication failed");
    } finally {
      setIsPasskeyLoading(false);
    }
  }

  function renderAuthProviderIcon(key: string, authProvider: AuthProvider) {
    if (key === "plex") {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          className="mr-2 h-4 w-4"
        >
          <path
            d="M256 70H148l108 186-108 186h108l108-186z"
            fill="currentColor"
          />
        </svg>
      );
    }

    if (authProvider.icon) {
      return (
        <img
          src={authProvider.icon}
          alt={`${authProvider.name} icon`}
          className="mr-2 h-4 w-4"
        />
      );
    }

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        className="mr-2 h-4 w-4"
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    );
  }

  const { control } = useForm({
    defaultValues: {
      password: "",
      username: "",
    },
    resolver: zodResolver(loginSchema),
  });

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-2xl">Login</CardTitle>
        <CardDescription>
          Enter your username below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        {authProviders["credential"]?.enabled && (
          <>
            <form
              method="POST"
              // use:loginEnhance
              action="?/login"
            >
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
                <span className="w-full border-t"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card text-muted-foreground px-2">
                  Or continue with
                </span>
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col gap-2">
          {Object.entries(authProviders).map(([key, provider]) => (
            <React.Fragment key={key}>
              {key !== "credential" && provider.enabled && (
                <Button
                  onClick={async () => {
                    await authClient.signIn.oauth2({
                      providerId: key,
                      callbackURL: "/",
                    });
                  }}
                  variant={lastLoginMethod === key ? "secondary" : "outline"}
                  className="relative w-full"
                  type="button"
                >
                  {renderAuthProviderIcon(key, provider)}
                  Login with{" "}
                  {provider.name || key.charAt(0).toUpperCase() + key.slice(1)}
                  {lastLoginMethod === key && <StarIcon />}
                </Button>
              )}
            </React.Fragment>
          ))}

          {supportsPasskey && (
            <Button
              variant={lastLoginMethod === "passkey" ? "secondary" : "outline"}
              className="relative w-full"
              disabled={isPasskeyLoading}
              onClick={handlePasskeySignIn}
              type="button"
            >
              <Fingerprint className="mr-2 h-4 w-4" />
              {isPasskeyLoading ? "Authenticating..." : "Sign in with Passkey"}

              {lastLoginMethod === "passkey" && <StarIcon />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
