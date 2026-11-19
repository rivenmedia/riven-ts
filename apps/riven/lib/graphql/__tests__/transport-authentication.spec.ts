import { gql } from "@apollo/client";
import { RequestContext } from "@mikro-orm/core";
import { getSessionCookie } from "better-auth/cookies";
import { print } from "graphql";
import { createClient } from "graphql-ws";
import { http, passthrough } from "msw";
import assert from "node:assert";
import { expect, vi } from "vitest";
import { WebSocket } from "ws";
import { createActor, createEmptyActor, toPromise } from "xstate";

import { it as testContext } from "#__tests__/test-context.ts";
import { initAuth } from "#auth/auth.ts";
import { pubSub } from "#graphql/pubsub.ts";
import { startGqlServer } from "#state-machines/bootstrap/actors/start-gql-server.actor.ts";
import { settings } from "#utilities/settings.ts";

import type { DocumentNode } from "@apollo/client";
import type { AnyActorRef } from "xstate";

vi.hoisted(() => {
  process.env["RIVEN_SETTING__port"] = "0";
});

interface GraphQLResponse {
  data?: unknown;
  errors?: { path?: (string | number)[]; extensions?: { code?: string } }[];
}

const summarizeResponse = ({ data = null, errors = [] }: GraphQLResponse) => ({
  data,
  errors: errors.map(({ path = [], extensions }) => ({
    path: path.join("."),
    code: extensions?.code,
  })),
});

const it = testContext
  .extend("serverOrigin", { scope: "file" }, async ({ orm }, { onCleanup }) => {
    const mainRunnerRef: AnyActorRef = createEmptyActor();

    const { server, url } = await toPromise(
      createActor(startGqlServer, {
        input: {
          orm,
          mainRunnerRef,
          validPlugins: new Map(),
          installedPlugins: [],
          pluginEnvironment: new Map(),
        },
      }).start(),
    );

    onCleanup(async () => server.stop());

    return new URL(url).origin;
  })
  .extend("graphqlEndpoint", ({ server, serverOrigin }) => {
    server.use(http.all(`${serverOrigin}/*`, () => passthrough()));

    return `${serverOrigin}/graphql`;
  })
  .extend("user", async ({ orm }) => {
    const auth = initAuth(orm);
    const email = "user@riven.test";
    const password = "correct horse battery staple";

    const { headers } = await RequestContext.create(orm.em, async () => {
      await auth.api.createUser({
        body: { name: "user", email, password, role: "user" },
      });

      return auth.api.signInEmail({
        body: { email, password },
        returnHeaders: true,
      });
    });

    const cookie = headers
      .getSetCookie()
      .map((setCookie) => setCookie.split(";", 1)[0])
      .join("; ");

    const sessionToken = getSessionCookie(new Headers({ cookie }), {
      cookiePrefix: "riven",
    });

    assert.ok(sessionToken);

    return { cookie, authorization: `Bearer ${sessionToken}` };
  })
  .extend(
    "request",
    ({ graphqlEndpoint }) =>
      async (query: DocumentNode, authorization?: string) => {
        const response = await fetch(graphqlEndpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(authorization && { authorization }),
          },
          body: JSON.stringify({ query: print(query) }),
        });

        return summarizeResponse((await response.json()) as GraphQLResponse);
      },
  )
  .extend(
    "subscribe",
    ({ graphqlEndpoint }, { onCleanup }) =>
      async (
        query: DocumentNode,
        variables: Record<string, unknown>,
        {
          headers = {},
          connectionParams = {},
        }: {
          headers?: Record<string, string>;
          connectionParams?: Record<string, string>;
        } = {},
      ) => {
        class WebSocketWithHeaders extends WebSocket {
          public constructor(address: string, protocols?: string | string[]) {
            super(address, protocols, { headers });
          }
        }

        const client = createClient({
          url: graphqlEndpoint.replace(/^http/u, "ws"),
          webSocketImpl: WebSocketWithHeaders,
          connectionParams,
          retryAttempts: 0,
        });

        const results = client.iterate({ query: print(query), variables });

        onCleanup(async () => {
          await results.return?.();
          await client.dispose();
        });

        const { value } = await results.next();

        return summarizeResponse(value as GraphQLResponse);
      },
  );

const SETTINGS_SECTION = gql`
  query TransportAuthenticationSpecSettingsSection {
    settingsSection(id: "general") {
      id
    }
  }
`;

it("resolves an HTTP request with the API key as the service", async ({
  request,
}) => {
  await expect(
    request(SETTINGS_SECTION, `Bearer ${settings.apiKey}`),
  ).resolves.toStrictEqual({
    data: { settingsSection: { id: "general" } },
    errors: [],
  });
});

it("denies an HTTP request without a credential", async ({ request }) => {
  await expect(request(SETTINGS_SECTION)).resolves.toStrictEqual({
    data: null,
    errors: [{ path: "settingsSection", code: "UNAUTHENTICATED" }],
  });
});

const MEDIA_ITEM_STATE_CHANGED = gql`
  subscription TransportAuthenticationSpecMediaItemStateChanged($id: ID!) {
    mediaItemStateChanged(id: $id) {
      ... on Movie {
        id
      }
    }
  }
`;

it("denies a WebSocket subscription without a credential", async ({
  completedMovieContext: { completedMovie },
  subscribe,
}) => {
  await expect(
    subscribe(MEDIA_ITEM_STATE_CHANGED, { id: completedMovie.id }),
  ).resolves.toStrictEqual({
    data: null,
    errors: [{ path: "mediaItemStateChanged", code: "UNAUTHENTICATED" }],
  });
});

it.for(["session cookie", "connection params"] as const)(
  "streams events to a WebSocket subscription with a credential in its %s",
  async (
    credentialSource,
    { completedMovieContext: { completedMovie }, subscribe, user },
  ) => {
    const firstEvent = subscribe(
      MEDIA_ITEM_STATE_CHANGED,
      { id: completedMovie.id },
      credentialSource === "session cookie"
        ? { headers: { cookie: user.cookie } }
        : { connectionParams: { authorization: user.authorization } },
    );

    const publishing = setInterval(() => {
      pubSub.publish(
        "MEDIA_ITEM_STATE_CHANGED",
        completedMovie.id,
        completedMovie.id,
      );
    }, 50);

    try {
      await expect(firstEvent).resolves.toStrictEqual({
        data: { mediaItemStateChanged: { id: completedMovie.id } },
        errors: [],
      });
    } finally {
      clearInterval(publishing);
    }
  },
);
