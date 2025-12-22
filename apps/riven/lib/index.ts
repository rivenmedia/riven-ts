import {
  InMemoryCache,
  HttpLink,
  ApolloClient,
  gql,
  ApolloLink,
  type TypedDocumentNode,
} from "@apollo/client";
import { RetryLink } from "@apollo/client/link/retry";
import { logger } from "@repo/core-util-logger";
import type { GetVersionQuery } from "./index.generated.ts";

const client = new ApolloClient({
  link: ApolloLink.from([
    new RetryLink({
      attempts: {
        max: 3,
      },
      delay: {
        initial: 1000,
        max: 10000,
      },
    }),
    new HttpLink({
      uri: "http://localhost:3000/graphql",
    }),
  ]),
  cache: new InMemoryCache(),
  dataMasking: true,
  devtools: {
    enabled: true,
  },
});

if (process.env["NODE_ENV"] === "development") {
  const { connectApolloClientToVSCodeDevTools } =
    await import("@apollo/client-devtools-vscode");

  connectApolloClientToVSCodeDevTools(client, "ws://localhost:7095");
}

const GET_VERSION: TypedDocumentNode<GetVersionQuery> = gql`
  query GetVersion {
    settings {
      riven {
        version
        logLevel
      }
    }
  }
`;

const { data } = await client.query({
  query: GET_VERSION,
});

logger.info(`Riven version: ${data?.settings.riven.version ?? ""}`);

logger.info("Riven is running!");
