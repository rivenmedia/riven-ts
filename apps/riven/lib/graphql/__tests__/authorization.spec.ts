import { MediaEntry, Movie } from "@repo/util-plugin-sdk/dto/entities";

import { RequestContext } from "@mikro-orm/core";
import { getSessionCookie } from "better-auth/cookies";
import { createClient } from "graphql-ws";
import { http, passthrough } from "msw";
import assert from "node:assert";
import { describe, expect, vi } from "vitest";
import { WebSocket } from "ws";
import { createActor, createEmptyActor, toPromise } from "xstate";

import { it as testContext } from "#__tests__/test-context.ts";
import { initAuth } from "#auth/auth.ts";
import { pubSub } from "#graphql/pubsub.ts";
import { startGqlServer } from "#state-machines/bootstrap/actors/start-gql-server.actor.ts";
import { settings } from "#utilities/settings.ts";

import type { UserRole } from "@repo/util-auth/access-control";
import type { AnyActorRef } from "xstate";

vi.hoisted(() => {
  // The server binds any free port. Settings are parsed on first import,
  // so this runs before the imports.
  process.env["RIVEN_SETTING__port"] = "0";
});

interface GraphQLResponse {
  data?: unknown;
  errors?: { path?: (string | number)[]; extensions?: { code?: string } }[];
}

const toResult = ({ data = null, errors = [] }: GraphQLResponse) => ({
  data,
  errors: errors
    .map(({ path = [], extensions }) => ({
      path: path.join("."),
      code: extensions?.code,
    }))
    .toSorted((a, b) => a.path.localeCompare(b.path)),
});

const downloadUrl = "https://debrid.example.com/download/movie.mkv";

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
  .extend("signIn", ({ orm }) => async (role: UserRole) => {
    const auth = initAuth(orm);
    const email = `${role}@riven.test`;
    const password = "correct horse battery staple";

    const { headers } = await RequestContext.create(orm.em, async () => {
      await auth.api.createUser({
        body: { name: role, email, password, role },
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
  .extend("admin", async ({ signIn }) => signIn("admin"))
  .extend("user", async ({ signIn }) => signIn("user"))
  .extend("movie", async ({ seeders, orm }) => {
    const { movie } = await seeders.seedCompletedMovie();

    await orm.em.nativeUpdate(
      MediaEntry,
      { mediaItem: movie.id },
      { downloadUrl },
    );

    const { originalFilename } = await orm.em
      .fork()
      .findOneOrFail(MediaEntry, { mediaItem: movie.id });

    return { id: movie.id, originalFilename };
  })
  .extend(
    "request",
    ({ graphqlEndpoint }) =>
      async (
        query: string,
        {
          authorization,
          variables,
        }: { authorization?: string; variables?: Record<string, unknown> } = {},
      ) => {
        const response = await fetch(graphqlEndpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            ...(authorization && { authorization }),
          },
          body: JSON.stringify({ query, variables }),
        });

        return toResult((await response.json()) as GraphQLResponse);
      },
  )
  .extend(
    "subscribe",
    ({ graphqlEndpoint }, { onCleanup }) =>
      async (
        query: string,
        variables: Record<string, unknown>,
        headers: Record<string, string> = {},
      ) => {
        class WebSocketWithHeaders extends WebSocket {
          public constructor(address: string, protocols?: string | string[]) {
            super(address, protocols, { headers });
          }
        }

        const client = createClient({
          url: graphqlEndpoint.replace(/^http/u, "ws"),
          webSocketImpl: WebSocketWithHeaders,
          retryAttempts: 0,
        });

        const results = client.iterate({ query, variables });

        onCleanup(async () => {
          await results.return?.();
          await client.dispose();
        });

        const { value } = await results.next();

        return toResult(value as GraphQLResponse);
      },
  );

const LIBRARY_AND_SETTINGS = /* GraphQL */ `
  query LibraryAndSettings($id: ID!) {
    mediaItems {
      items {
        __typename
      }
    }
    mediaItemById(id: $id) {
      ... on Movie {
        mediaEntries {
          originalFilename
          downloadUrl
        }
      }
    }
    settingsSection(id: "general") {
      id
    }
  }
`;

describe("scenario 1: a valid credential", () => {
  it.for(["admin session token", "API key"] as const)(
    "returns every authenticated field to the %s",
    async (credential, { admin, movie, request }) => {
      const authorization =
        credential === "API key"
          ? `Bearer ${settings.apiKey}`
          : admin.authorization;

      await expect(
        request(LIBRARY_AND_SETTINGS, {
          authorization,
          variables: { id: movie.id },
        }),
      ).resolves.toStrictEqual({
        data: {
          mediaItems: { items: [{ __typename: "Movie" }] },
          mediaItemById: {
            mediaEntries: [
              { originalFilename: movie.originalFilename, downloadUrl },
            ],
          },
          settingsSection: { id: "general" },
        },
        errors: [],
      });
    },
  );
});

describe("scenario 2: an invalid credential", () => {
  it("returns public fields and denies every authenticated field", async ({
    request,
  }) => {
    await expect(
      request(
        /* GraphQL */ `
          query PublicAndAuthenticated {
            authProviders {
              key
            }
            itemRequestByExternalIds(tmdbId: "550") {
              id
            }
            vfsEntry(path: "/") {
              __typename
            }
          }
        `,
        { authorization: "Bearer garbage" },
      ),
    ).resolves.toStrictEqual({
      data: {
        authProviders: expect.arrayContaining([{ key: "credential" }]),
        itemRequestByExternalIds: null,
        vfsEntry: null,
      },
      errors: [
        { path: "itemRequestByExternalIds", code: "UNAUTHENTICATED" },
        { path: "vfsEntry", code: "UNAUTHENTICATED" },
      ],
    });
  });
});

describe("scenario 3: a partly authorised caller", () => {
  it("returns the sibling fields the caller may read", async ({
    movie: _movie,
    request,
    user,
  }) => {
    await expect(
      request(
        /* GraphQL */ `
          query LibraryAndVfs {
            mediaItems {
              items {
                __typename
              }
            }
            vfsEntry(path: "/") {
              __typename
            }
          }
        `,
        { authorization: user.authorization },
      ),
    ).resolves.toStrictEqual({
      data: {
        mediaItems: { items: [{ __typename: "Movie" }] },
        vfsEntry: null,
      },
      errors: [{ path: "vfsEntry", code: "UNAUTHORIZED" }],
    });
  });

  it("denies a nested field that its readable parent does not grant", async ({
    movie,
    request,
    user,
  }) => {
    await expect(
      request(
        /* GraphQL */ `
          query MediaEntries($id: ID!) {
            mediaItemById(id: $id) {
              ... on Movie {
                mediaEntries {
                  originalFilename
                  downloadUrl
                }
              }
            }
          }
        `,
        { authorization: user.authorization, variables: { id: movie.id } },
      ),
    ).resolves.toStrictEqual({
      data: {
        mediaItemById: {
          mediaEntries: [
            { originalFilename: movie.originalFilename, downloadUrl: null },
          ],
        },
      },
      errors: [
        {
          path: "mediaItemById.mediaEntries.0.downloadUrl",
          code: "UNAUTHORIZED",
        },
      ],
    });
  });

  it("runs the mutations the caller's role grants and no others", async ({
    movie,
    orm,
    request,
    user,
  }) => {
    await expect(
      request(
        /* GraphQL */ `
          mutation RequestItem($input: RequestItemInput!) {
            requestItem(input: $input)
          }
        `,
        {
          authorization: user.authorization,
          variables: {
            input: {
              requestedBy: "user@riven.test",
              tmdbId: "550",
              type: "movie",
            },
          },
        },
      ),
    ).resolves.toStrictEqual({ data: { requestItem: true }, errors: [] });

    await expect(
      request(
        /* GraphQL */ `
          mutation ResetMediaItem($id: ID!) {
            resetMediaItem(mediaItemId: $id) {
              __typename
            }
          }
        `,
        { authorization: user.authorization, variables: { id: movie.id } },
      ),
    ).resolves.toStrictEqual({
      data: null,
      errors: [{ path: "resetMediaItem", code: "UNAUTHORIZED" }],
    });

    await expect(
      orm.em.fork().findOneOrFail(Movie, movie.id),
    ).resolves.toMatchObject({ state: "completed" });
  });
});

describe("scenario 4: no credential", () => {
  it("returns public fields", async ({ request }) => {
    await expect(
      request(/* GraphQL */ `
        query AuthProviders {
          authProviders {
            key
          }
        }
      `),
    ).resolves.toStrictEqual({
      data: { authProviders: expect.arrayContaining([{ key: "credential" }]) },
      errors: [],
    });
  });
});

describe("subscriptions", () => {
  const MEDIA_ITEM_STATE_CHANGED = /* GraphQL */ `
    subscription AuthorizationMediaItemStateChanged($id: ID!) {
      mediaItemStateChanged(id: $id) {
        ... on Movie {
          id
        }
      }
    }
  `;

  it("denies a WebSocket subscription without a session cookie", async ({
    movie,
    subscribe,
  }) => {
    await expect(
      subscribe(MEDIA_ITEM_STATE_CHANGED, { id: movie.id }),
    ).resolves.toStrictEqual({
      data: null,
      errors: [{ path: "mediaItemStateChanged", code: "UNAUTHENTICATED" }],
    });
  });

  it("streams events to a WebSocket subscription with a session cookie", async ({
    movie,
    subscribe,
    user,
  }) => {
    const firstEvent = subscribe(
      MEDIA_ITEM_STATE_CHANGED,
      { id: movie.id },
      { cookie: user.cookie },
    );

    // The server starts the subscription asynchronously, so publish until an event arrives.
    const publishing = setInterval(() => {
      pubSub.publish("MEDIA_ITEM_STATE_CHANGED", movie.id, movie.id);
    }, 50);

    try {
      await expect(firstEvent).resolves.toStrictEqual({
        data: { mediaItemStateChanged: { id: movie.id } },
        errors: [],
      });
    } finally {
      clearInterval(publishing);
    }
  });
});
