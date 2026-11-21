import { graphql } from "msw/graphql";
import { HttpResponse } from "msw/http";
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

/**
 * Answers the query only when its authorization header passes `isAuthorized`,
 * the way the backend rejects unauthenticated requests.
 */
function answerQueryWhen(
  server: SetupServer,
  isAuthorized: (authorization: string | null) => boolean,
) {
  server.use(
    backend.query(GET_INSTANCE_SETUP_REQUIRED, ({ request }) => {
      if (!isAuthorized(request.headers.get("authorization"))) {
        return HttpResponse.json(
          { errors: [{ message: "Unexpected authorization header" }] },
          { status: 401 },
        );
      }

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

  return getClient().query({ query: GET_INSTANCE_SETUP_REQUIRED });
}

const answered = {
  data: { instanceStatus: { setupRequired: false } },
};

it.for(["riven.session_token", "__Secure-riven.session_token"])(
  "with a session cookie, sends the %s cookie as a bearer token",
  async (cookieName, { server, setRequestCookies }) => {
    setRequestCookies(
      `theme=dark; ${cookieName}=${encodeURIComponent(sessionToken)}`,
    );

    await expect(
      answerQueryWhen(server, (authorization) => {
        const [scheme, token] = authorization?.split(" ") ?? [];

        return (
          scheme === "Bearer" &&
          decodeURIComponent(token ?? "") === sessionToken
        );
      }),
    ).resolves.toMatchObject(answered);
  },
);

it("without a session cookie, sends no authorization header", async ({
  server,
  setRequestCookies,
}) => {
  setRequestCookies("theme=dark");

  await expect(
    answerQueryWhen(server, (authorization) => authorization === null),
  ).resolves.toMatchObject(answered);
});

it("without a session cookie, sends no authorization header outside a request scope", async ({
  server,
}) => {
  await expect(
    answerQueryWhen(server, (authorization) => authorization === null),
  ).resolves.toMatchObject(answered);
});
