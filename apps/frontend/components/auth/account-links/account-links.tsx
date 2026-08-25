import { SingleAccountLink } from "./single-account-link";

import type { Account, Provider } from "./types";

export interface AccountLinksProps {
  accounts: Account[];
  providers: Record<string, Provider>;
}

export function AccountLinks({ accounts, providers }: AccountLinksProps) {
  return (
    <section className="border-border/60 grid gap-4 border-b py-6 md:grid-cols-[12rem_minmax(0,1fr)]">
      <div>
        <h2 className="text-base font-semibold">Account Links</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage your linked authentication providers.
        </p>
      </div>
      <div className="flex min-w-0 flex-col">
        {Object.entries(providers).map(([providerId, config]) => (
          <SingleAccountLink
            key={providerId}
            account={accounts.find(({ providerId: id }) => id === providerId)}
            providerId={providerId}
            provider={config}
          />
        ))}
      </div>
    </section>
  );
}
