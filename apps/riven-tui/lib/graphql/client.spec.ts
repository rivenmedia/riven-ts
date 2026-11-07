import { gql } from "@apollo/client";
import { once } from "node:events";
import { createServer } from "node:http";
import { it as baseIt, describe, expect } from "vitest";

import { RivenTuiSettingsSchema } from "../riven-tui-settings.schema.ts";
import { createGraphqlClient } from "./client.ts";

import type { AddressInfo } from "node:net";

const it = baseIt.extend("riven", async ({}, { onCleanup }) => {
  const authorizationHeaders: (string | undefined)[] = [];

  const server = createServer((request, response) => {
    authorizationHeaders.push(request.headers.authorization);

    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify({ data: { authProviders: [] } }));
  });

  server.listen(0, "127.0.0.1");

  await once(server, "listening");

  onCleanup(() => {
    server.closeAllConnections();
    server.close();
  });

  const { port } = server.address() as AddressInfo;

  return {
    graphqlUrl: `http://127.0.0.1:${String(port)}/graphql`,
    authorizationHeaders,
  };
});

const apiKey = "riven-api-key-0123456789abcdef0123456789";

describe("authorization header", () => {
  it.for([
    [
      "sends a configured API key as a bearer token",
      { RIVEN_TUI_SETTING__apiKey: apiKey },
      `Bearer ${apiKey}`,
    ],
    ["sends no authorization header without an API key", {}, undefined],
    [
      "sends no authorization header with an empty API key",
      { RIVEN_TUI_SETTING__apiKey: "" },
      undefined,
    ],
  ] as const)("%s", async ([, environment, expected], { riven }) => {
    const settings = RivenTuiSettingsSchema.parse({
      ...environment,
      RIVEN_TUI_SETTING__graphqlUrl: riven.graphqlUrl,
    });

    const client = createGraphqlClient({
      uri: settings.RIVEN_TUI_SETTING__graphqlUrl,
      apiKey: settings.RIVEN_TUI_SETTING__apiKey,
    });

    await client.query({
      query: gql`
        query Probe {
          authProviders {
            key
          }
        }
      `,
    });

    expect(riven.authorizationHeaders).toStrictEqual([expected]);
  });
});
