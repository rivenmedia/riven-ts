import { startCase } from "es-toolkit";
import Image from "next/image";

import { LinkAccountButton } from "./_components/link-account-button.tsx";
import { UnlinkAccountButton } from "./_components/unlink-account-button.tsx";

import type { AuthProvider } from "#app/_types/__generated__/graphql.ts";

export interface SingleAccountLinkProps {
  hasLinkedAccount: boolean;
  providerId: string;
  provider: Pick<AuthProvider, "name" | "icon" | "enabled">;
}

export function SingleAccountLink({
  hasLinkedAccount,
  provider,
  providerId,
}: SingleAccountLinkProps) {
  const providerName = provider.name ?? startCase(providerId);

  if (!provider.enabled || providerId === "credential") {
    return null;
  }

  const ActionButton = hasLinkedAccount
    ? UnlinkAccountButton
    : LinkAccountButton;

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
      <ActionButton providerId={providerId} providerName={providerName} />
    </div>
  );
}
