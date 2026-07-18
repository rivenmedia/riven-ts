"use client";

import { Fingerprint, StarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PasskeySigninButtonProps {
  lastLoginMethod: string | null;
  isPasskeyLoading: boolean;
  handlePasskeySignIn: () => Promise<void>;
}

export function PasskeySigninButton({
  lastLoginMethod,
  isPasskeyLoading,
  handlePasskeySignIn,
}: PasskeySigninButtonProps) {
  const supportsPasskey =
    typeof window !== "undefined" && !!window.PublicKeyCredential;

  if (!supportsPasskey) {
    return null;
  }

  return (
    <Button
      variant={lastLoginMethod === "passkey" ? "secondary" : "outline"}
      className="relative w-full"
      disabled={isPasskeyLoading}
      onClick={() => void handlePasskeySignIn()}
      type="button"
    >
      <Fingerprint className="mr-2 h-4 w-4" />
      {isPasskeyLoading ? "Authenticating..." : "Sign in with Passkey"}
      {lastLoginMethod === "passkey" && <StarIcon />}
    </Button>
  );
}
