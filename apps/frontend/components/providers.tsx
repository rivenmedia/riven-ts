import { StrictMode } from "react";

import { ClientProviders } from "./providers.client.tsx";
import { ApolloWrapper } from "./providers/apollo-provider.tsx";
import { ThemeProvider } from "./providers/theme-provider.tsx";

import type { PropsWithChildren } from "react";

export const Providers = ({ children }: Required<PropsWithChildren>) => (
  <StrictMode>
    <ApolloWrapper>
      <ThemeProvider>
        <ClientProviders>{children}</ClientProviders>
      </ThemeProvider>
    </ApolloWrapper>
  </StrictMode>
);
