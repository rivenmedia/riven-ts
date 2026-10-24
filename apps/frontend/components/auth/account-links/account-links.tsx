import { FormBase } from "#components/auth/form-base/form-base.tsx";

import { SingleAccountLink } from "./single-account-link.tsx";

import type { SingleAccountLinkProps } from "./single-account-link.tsx";
import type { Account } from "better-auth";

export interface AccountLinksProps {
  accounts: Pick<Account, "providerId">[];
  providers: Record<string, SingleAccountLinkProps["provider"]>;
}

/**
 * Lists each configured auth provider and lets the user link or unlink their
 * account for it.
 */
export function AccountLinks({ accounts, providers }: AccountLinksProps) {
  function renderContent() {
    const providerEntries = Object.entries(providers);

    if (providerEntries.length === 0) {
      return (
        <p className="text-muted-foreground text-sm">
          No authentication providers are configured.
        </p>
      );
    }

    return providerEntries.map(([providerId, config]) => (
      <SingleAccountLink
        key={providerId}
        hasLinkedAccount={accounts.some(
          ({ providerId: id }) => id === providerId,
        )}
        providerId={providerId}
        provider={config}
      />
    ));
  }

  return (
    <FormBase
      title="Account Links"
      description="Manage your linked authentication providers"
      content={renderContent()}
    />
  );
}
