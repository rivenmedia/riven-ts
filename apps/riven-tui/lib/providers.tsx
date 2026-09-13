import { ApolloProvider } from "@apollo/client/react";
import { InkPictureProvider } from "ink-picture";
import { useMemo } from "react";
import { MemoryRouter } from "react-router";

import { createGraphqlClient } from "./graphql/client.ts";
import { settings } from "./settings.ts";
import { ActionsMenuProvider } from "./ui/actions-menu/actions-menu-context.tsx";

import type { PropsWithChildren } from "react";

export function Providers({ children }: PropsWithChildren) {
  const client = useMemo(
    () => createGraphqlClient({ uri: settings.RIVEN_TUI_SETTING__graphqlUrl }),
    [],
  );

  return (
    <MemoryRouter initialEntries={["/library"]}>
      <ApolloProvider client={client}>
        <InkPictureProvider>
          <ActionsMenuProvider>{children}</ActionsMenuProvider>
        </InkPictureProvider>
      </ApolloProvider>
    </MemoryRouter>
  );
}
