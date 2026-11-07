import { HttpResponse } from "msw";
import { graphql } from "msw/graphql";
import { setupServer } from "msw/node";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { it as baseIt, expect, vi } from "vitest";

import { GET_INSTANCE_SETUP_REQUIRED } from "#app/_queries/get-instance-setup-required.query.ts";
import { privateEnvironment } from "#environment/private-environment.schema.ts";

import { getClient } from "./client.ts";

import type { registerApolloClient } from "@apollo/client-integration-nextjs";
import type { SetupServer } from "msw/node";

vi.mock(
  import("@apollo/client-integration-nextjs"),
  async (importOriginal) => ({
    ...(await importOriginal()),
    // Only the `react-server` export condition, which tests don't resolve, provides `registerApolloClient`
    registerApolloClient: ((makeClient) => ({
      getClient: makeClient,
    })) as typeof registerApolloClient,
  }),
);

vi.mock(import("next/headers"), async (importOriginal) => {
  const actual = await importOriginal();

  return { ...actual, cookies: vi.fn<typeof actual.cookies>(actual.cookies) };
});

const it = baseIt
  .extend("server", { auto: true }, ({}, { onCleanup }) => {
    const server = setupServer();

    server.listen({ onUnhandledFrame: "error" });

    onCleanup(() => {
      server.close();
    });

    return server;
  })
  .extend("setRequestCookies", ({}, { onCleanup }) => {
    onCleanup(() => {
      vi.mocked(cookies).mockReset();
    });

    return (cookie: string) => {
      vi.mocked(cookies).mockResolvedValue(
        new NextRequest("https://localhost:9000", { headers: { cookie } })
          .cookies as unknown as Awaited<ReturnType<typeof cookies>>,
      );
    };
  });

const backend = graphql.link(
  new URL("/graphql", privateEnvironment.BACKEND_URL).toString(),
);

const sessionToken = "Fq1kU3B6.dGhlLXNpZ25hdHVyZQ+/==";

async function sendQueryAndReadAuthorization(server: SetupServer) {
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

  await getClient().query({ query: GET_INSTANCE_SETUP_REQUIRED });

  return authorization.promise;
}

it.for(["riven.session_token", "__Secure-riven.session_token"])(
  "with a session cookie, sends the %s cookie as a bearer token",
  async (cookieName, { server, setRequestCookies }) => {
    setRequestCookies(
      `theme=dark; ${cookieName}=${encodeURIComponent(sessionToken)}`,
    );

    const authorization = await sendQueryAndReadAuthorization(server);
    const [scheme, token] = authorization?.split(" ") ?? [];

    expect(scheme).toBe("Bearer");
    expect(decodeURIComponent(token ?? "")).toBe(sessionToken);
  },
);

it("without a session cookie, sends no authorization header", async ({
  server,
  setRequestCookies,
}) => {
  setRequestCookies("theme=dark");

  await expect(sendQueryAndReadAuthorization(server)).resolves.toBeNull();
});

it("without a session cookie, sends no authorization header outside a request scope", async ({
  server,
}) => {
  await expect(sendQueryAndReadAuthorization(server)).resolves.toBeNull();
});
