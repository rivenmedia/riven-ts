import { startCase } from "es-toolkit";
import { Link2, Link2Off } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import Image from "next/image";
import { toast } from "sonner";

import { Button } from "#components/_ui/button.tsx";

import { linkAccount } from "./_actions/link-account.action.ts";
import { unlinkAccount } from "./_actions/unlink-account.action.ts";

import type { Account, Provider } from "./types.d.ts";

interface SingleAccountLinkProps {
  account: Account | undefined;
  providerId: string;
  provider: Provider;
}

export function SingleAccountLink({
  account,
  provider,
  providerId,
}: SingleAccountLinkProps) {
  const providerName = provider.name ?? startCase(providerId);

  const linkAccountAction = useAction(linkAccount, {
    onError() {
      toast.error("Failed to link account.");
    },
    onSuccess() {
      toast.success(`${providerName} linked successfully.`);
    },
  });

  const unlinkAccountAction = useAction(unlinkAccount, {
    onError() {
      toast.error("Failed to unlink account.");
    },
    onSuccess() {
      toast.success(`${providerName} unlinked successfully.`);
    },
  });

  if (!provider.enabled || providerId === "credential") {
    return null;
  }

  return (
    <div className="border-border/60 flex items-center justify-between border-t py-3">
      <div className="flex items-center gap-2">
        {provider.icon && (
          <Image
            src={provider.icon}
            alt="{providerName} icon"
            className="h-4 w-4"
          />
        )}
        <span>{providerName}</span>
      </div>
      {account?.providerId === providerId ? (
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
      ) : (
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
      )}
    </div>
  );
}
