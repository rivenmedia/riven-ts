#!/usr/bin/env node

import { ApolloProvider } from "@apollo/client/react";
import { render } from "ink";
import { MemoryRouter } from "react-router";

import { createGraphqlClient } from "./graphql/client.ts";
import { settings } from "./settings.ts";
import { App } from "./ui/app.tsx";

const client = createGraphqlClient({ uri: settings.graphqlUrl });

render(
  <MemoryRouter>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </MemoryRouter>,
);
