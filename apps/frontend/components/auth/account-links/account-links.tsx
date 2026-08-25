import { FormBase } from "../form-base/form-base";
import { SingleAccountLink } from "./single-account-link";

import type { Account, Provider } from "./types";

export interface AccountLinksProps {
  accounts: Account[];
  providers: Record<string, Provider>;
}

export function AccountLinks({ accounts, providers }: AccountLinksProps) {
  return (
    <FormBase
      title="Account Links"
      description="Manage your linked authentication providers"
      content={Object.entries(providers).map(([providerId, config]) => (
        <SingleAccountLink
          key={providerId}
          account={accounts.find(({ providerId: id }) => id === providerId)}
          providerId={providerId}
          provider={config}
        />
      ))}
    />
  );
}
