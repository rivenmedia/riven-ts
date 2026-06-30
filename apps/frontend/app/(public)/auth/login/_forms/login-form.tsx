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
import { createScopedLogger } from "@/lib/logger";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { StarIcon } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import { Controller } from "react-hook-form";
import { toast } from "react-toastify";

import { loginUser } from "../_actions/login.action";
import { loginSchema } from "../_form-schemas/login.schema";

import type { AuthProvider } from "@/app/_types/__generated__/graphql";

const logger = createScopedLogger("login");

const PasskeySigninButton = dynamic(
  () =>
    import("../_components/passkey-signin-button").then(
      (mod) => mod.PasskeySigninButton,
    ),
  { ssr: false },
);

interface LoginFormProps {
  authProviders: AuthProvider[];
  isCredentialProviderEnabled: boolean;
  lastLoginMethod: string | null;
}

export const LoginForm = ({
  authProviders,
  isCredentialProviderEnabled,
  lastLoginMethod,
}: LoginFormProps) => {
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);

  function handleSuccessfulSignin() {
    window.history.replaceState(null, "", "/");
  }

  useEffect(() => {
    async function maybeAutoPasskeySignIn() {
      if (
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

  async function handleOAuthSignIn(providerId: string) {
    try {
      await authClient.signIn.oauth2({
        providerId,
        callbackURL: "/",
      });
    } catch {
      toast.error("Login failed");
    }
  }

  function renderAuthProviderIcon(
    key: string,
    authProvider: Omit<AuthProvider, "key">,
  ) {
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
        <Image
          src={authProvider.icon}
          alt={`${authProvider.name ?? key} icon`}
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
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mr-2 h-4 w-4"
      >
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    );
  }

  const { form, handleSubmitWithAction } = useHookFormAction(
    loginUser.bind(null, {
      isCredentialEnabled: isCredentialProviderEnabled,
    }),
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
            <form onSubmit={(e) => void handleSubmitWithAction(e)}>
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
          {authProviders.map(({ key, ...provider }) => (
            <React.Fragment key={key}>
              {key !== "credential" && provider.enabled && (
                <Button
                  onClick={() => void handleOAuthSignIn(key)}
                  variant={lastLoginMethod === key ? "secondary" : "outline"}
                  className="relative w-full"
                  type="button"
                >
                  {renderAuthProviderIcon(key, provider)}
                  Login with{" "}
                  {provider.name ?? key.charAt(0).toUpperCase() + key.slice(1)}
                  {lastLoginMethod === key && <StarIcon />}
                </Button>
              )}
            </React.Fragment>
          ))}

          <PasskeySigninButton
            lastLoginMethod={lastLoginMethod}
            isPasskeyLoading={isPasskeyLoading}
            handlePasskeySignIn={handlePasskeySignIn}
          />
        </div>
      </CardContent>
    </Card>
  );
};
