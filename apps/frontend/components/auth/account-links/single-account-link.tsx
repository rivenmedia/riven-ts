import { Button } from "@/components/_ui/button";
import { authClient } from "@/lib/auth/client";

import { Link2, Link2Off } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

import type { Account, Provider } from "./types";

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
  if (!provider.enabled || providerId === "credential") {
    return null;
  }

  const providerName =
    provider.name ?? providerId.charAt(0).toUpperCase() + providerId.slice(1);

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
          onClick={async () => {
            await authClient.unlinkAccount({
              providerId,
            });

            toast.success(`${providerId} unlinked successfully.`);

            await goto(resolve("/auth"), { invalidateAll: true });
          }}
        >
          <Link2Off className="mr-2 h-4 w-4" />
          Unlink
        </Button>
      ) : (
        <Button
          size="sm"
          onClick={async () => {
            if (isGenericOAuthProvider(providerId)) {
              // Use oauth2.link() for generic OAuth providers
              await authClient.oauth2.link({
                providerId,
                callbackURL: "/auth",
              });
            } else {
              // Use linkSocial() for built-in social providers (plex)
              await authClient.linkSocial({
                provider: providerId,
                callbackURL: "/auth",
              });
            }

            toast.success(`${providerId} linked successfully.`);
          }}
        >
          <Link2 className="mr-2 h-4 w-4" />
          Link
        </Button>
      )}
    </div>
  );
}
