"use client";

import { Button } from "@/components/_ui/button";

import { Fingerprint, StarIcon } from "lucide-react";
import { use } from "react";
import { browser } from "react-dom";

import { browserSupportsPasskeys } from "../_utils/browser-supports-passkeys";

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
  use(browser());

  if (!browserSupportsPasskeys(globalThis.window)) {
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
