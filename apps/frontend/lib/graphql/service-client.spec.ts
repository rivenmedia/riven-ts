import { HttpResponse } from "msw";
import { graphql } from "msw/graphql";
import { setupServer } from "msw/node";
import { it as baseIt, expect, vi } from "vitest";

import { GET_INSTANCE_SETUP_REQUIRED } from "#app/_queries/get-instance-setup-required.query.ts";
import { privateEnvironment } from "#environment/private-environment.schema.ts";

import type { registerApolloClient } from "@apollo/client-integration-nextjs";

vi.mock(
  import("@apollo/client-integration-nextjs"),
  async (importOriginal) => ({
    ...(await importOriginal()),
    // Only the `react-server` export condition, which tests don't resolve, provides `registerApolloClient`
    registerApolloClient: ((makeClient) => ({
      query: async (options) => {
        const client = await makeClient();

        return client.query(options);
      },
    })) as typeof registerApolloClient,
  }),
);

const it = baseIt
  .extend("server", { auto: true }, ({}, { onCleanup }) => {
    const server = setupServer();

    server.listen({ onUnhandledFrame: "error" });

    onCleanup(() => {
      server.close();
    });

    return server;
  })
  .extend("loadQuery", ({}, { onCleanup }) => {
    onCleanup(() => {
      vi.unstubAllEnvs();
    });

    // The environment is parsed when the module loads
    return async (apiKey: string | undefined) => {
      vi.stubEnv("BACKEND_API_KEY", apiKey);
      vi.resetModules();

      const { query } = await import("./service-client.ts");

      return query;
    };
  });

const backend = graphql.link(
  new URL("/graphql", privateEnvironment.BACKEND_URL).toString(),
);

const apiKey = "riven-api-key-0123456789abcdef0123456789";

it("with BACKEND_API_KEY set, sends the API key as a bearer token", async ({
  server,
  loadQuery,
}) => {
  const authorization = Promise.withResolvers<string | null>();

  server.use(
    backend.query(GET_INSTANCE_SETUP_REQUIRED, ({ request }) => {
      authorization.resolve(request.headers.get("authorization"));

      return HttpResponse.json({
        data: {
          instanceStatus: {
            __typename: "InstanceStatus",
            setupRequired: false,
          },
        },
      });
    }),
  );

  const query = await loadQuery(apiKey);

  await query({ query: GET_INSTANCE_SETUP_REQUIRED });

  await expect(authorization.promise).resolves.toBe(`Bearer ${apiKey}`);
});

it("without BACKEND_API_KEY, fails the query with an error naming the variables", async ({
  loadQuery,
}) => {
  const query = await loadQuery(undefined);

  await expect(query({ query: GET_INSTANCE_SETUP_REQUIRED })).rejects.toThrow(
    "BACKEND_API_KEY is not set. Set it to the value of Riven's RIVEN_SETTING__apiKey.",
  );
});
