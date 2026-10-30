"use client";

import { Link2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { Button } from "#components/_ui/button.tsx";

import { linkAccount } from "../_actions/link-account.action.ts";

interface LinkAccountButtonProps {
  providerId: string;
  providerName: string;
}

export function LinkAccountButton({
  providerId,
  providerName,
}: LinkAccountButtonProps) {
  const linkAccountAction = useAction(linkAccount, {
    onError() {
      toast.error("Failed to link account.");
    },
    onSuccess() {
      toast.success(`${providerName} linked successfully.`);
    },
  });

  return (
    <Button
      size="sm"
      onClick={() => {
        linkAccountAction.execute({ providerId });
      }}
      type="button"
    >
      <Link2 className="mr-2 h-4 w-4" />
      Link
    </Button>
  );
}
