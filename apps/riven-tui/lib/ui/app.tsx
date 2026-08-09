import { Box, useApp, useInput } from "ink";
import { useState } from "react";

import { ItemDetailScreen } from "./screens/item-detail-screen.tsx";
import { LibraryScreen } from "./screens/library-screen.tsx";

import type { GraphqlClient } from "../graphql/graphql-client.ts";

export interface AppProps {
  client: GraphqlClient;
}

type Route = { id: string; screen: "item" } | { screen: "library" };

const LIBRARY_ROUTE: Route = { screen: "library" };

export function App({ client }: AppProps) {
  const { exit } = useApp();
  const [stack, setStack] = useState<Route[]>([LIBRARY_ROUTE]);
  const route = stack.at(-1) ?? LIBRARY_ROUTE;

  useInput((input) => {
    if (input === "q") {
      exit();
    }
  });

  const push = (next: Route) => {
    setStack((current) => [...current, next]);
  };

  const pop = () => {
    setStack((current) =>
      current.length > 1 ? current.slice(0, -1) : current,
    );
  };

  return (
    <Box flexDirection="column" padding={1}>
      {route.screen === "library" && (
        <LibraryScreen
          client={client}
          onSelectItem={(id) => {
            push({ screen: "item", id });
          }}
        />
      )}
      {route.screen === "item" && (
        <ItemDetailScreen
          key={route.id}
          client={client}
          id={route.id}
          onBack={pop}
          onSelectChild={(id) => {
            push({ screen: "item", id });
          }}
        />
      )}
    </Box>
  );
}
