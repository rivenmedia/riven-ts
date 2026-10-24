"use client";

import { Link2Off } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

import { Button } from "#components/_ui/button.tsx";

import { unlinkAccount } from "../_actions/unlink-account.action.ts";

interface UnlinkAccountButtonProps {
  providerId: string;
  providerName: string;
}

export function UnlinkAccountButton({
  providerId,
  providerName,
}: UnlinkAccountButtonProps) {
  const unlinkAccountAction = useAction(unlinkAccount, {
    onError() {
      toast.error("Failed to unlink account.");
    },
    onSuccess() {
      toast.success(`${providerName} unlinked successfully.`);
    },
  });

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => {
        unlinkAccountAction.execute({ providerId });
      }}
      type="button"
    >
      <Link2Off className="mr-2 h-4 w-4" />
      Unlink
    </Button>
  );
}
