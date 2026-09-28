import { StrictMode } from "react";

import { ClientProviders } from "./providers.client";
import { ApolloWrapper } from "./providers/apollo-provider";
import { ThemeProvider } from "./providers/theme-provider";

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
