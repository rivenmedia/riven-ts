import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

import { StarIcon } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import React, { useState } from "react";
import { toast } from "react-toastify";

import type { AuthProvider } from "@/app/_types/__generated__/graphql";

const PasskeySigninButton = dynamic(
  () =>
    import("../_components/passkey-signin-button").then(
      (mod) => mod.PasskeySigninButton,
    ),
  { ssr: false },
);

interface OAuthProvidersProps {
  authProviders: AuthProvider[];
  onSignIn: () => void;
  lastLoginMethod: string | null;
}

export function OAuthProviders({
  authProviders,
  onSignIn,
  lastLoginMethod,
}: OAuthProvidersProps) {
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);

  async function handlePasskeySignIn() {
    setIsPasskeyLoading(true);

    try {
      await authClient.signIn.passkey({
        fetchOptions: {
          onSuccess: onSignIn,
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

  return (
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
  );
}
