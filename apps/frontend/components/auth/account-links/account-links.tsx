import { FormBase } from "#components/auth/form-base/form-base.tsx";

import { SingleAccountLink } from "./single-account-link.tsx";

import type { Account, Provider } from "./types.d.ts";

export interface AccountLinksProps {
  accounts: Account[];
  providers: Record<string, Provider>;
}

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
        account={accounts.find(({ providerId: id }) => id === providerId)}
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
