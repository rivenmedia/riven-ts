import { HttpResponse } from "msw/http";
import assert from "node:assert";
import { expect, vi } from "vitest";

import { getAuthMeHandler } from "../__generated__/handlers/getAuthMeHandler.ts";
import { getRequestHandler } from "../__generated__/handlers/getRequestHandler.ts";
import { it as baseIt } from "../__tests__/seerr.test-context.ts";

import type { RequestResponse } from "../schemas/request-response.schema.ts";
import type { GraphQLContext } from "@repo/util-plugin-sdk/types/graphql-context";

const it = baseIt.extend("requests", (): RequestResponse => ({
  pageInfo: { results: 2 },
  results: [
    { id: 1, status: 2, type: "movie", media: { tmdbId: 550 } },
    {
      id: 2,
      status: 2,
      type: "tv",
      media: { id: 20, tmdbId: 1399, tvdbId: 121_361 },
      seasons: [{ id: 3, status: 2, seasonNumber: 1 }],
    },
  ],
}));

const requestsWithFilter = (requests: RequestResponse, filter: string) =>
  getRequestHandler(({ request }) => {
    if (new URL(request.url).searchParams.get("filter") !== filter) {
      return HttpResponse.json(null, { status: 400 });
    }

    return HttpResponse.json<RequestResponse>(requests);
  });

const CASES = [
  { field: "seerrMovies", expected: [{ tmdbId: "550", tvdbId: null }] },
  { field: "seerrShows", expected: [{ tmdbId: "1399", tvdbId: "121361" }] },
] as const;

it.for(CASES)(
  "$field returns the requested items for the given filter",
  async ({ field, expected }, { gqlContext, gqlServer, requests, server }) => {
    server.use(requestsWithFilter(requests, "pending"));

    const { body } = await gqlServer.executeOperation(
      {
        query: `query { ${field}(filter: pending) { tmdbId tvdbId } }`,
      },
      { contextValue: gqlContext },
    );

    assert.ok(body.kind === "single");

    expect(body.singleResult.errors).toBeUndefined();
    // GraphQL results are null-prototype objects, which `toStrictEqual` treats as different from object literals
    expect(body.singleResult.data?.[field]).toStrictEqual(
      expected.map((item) => expect.objectContaining(item)),
    );
  },
);

it.for(CASES)(
  "$field filters by approved requests by default",
  async ({ field, expected }, { gqlContext, gqlServer, requests, server }) => {
    server.use(requestsWithFilter(requests, "approved"));

    const { body } = await gqlServer.executeOperation(
      { query: `query { ${field} { tmdbId tvdbId } }` },
      { contextValue: gqlContext },
    );

    assert.ok(body.kind === "single");

    expect(body.singleResult.errors).toBeUndefined();
    expect(body.singleResult.data?.[field]).toStrictEqual(
      expected.map((item) => expect.objectContaining(item)),
    );
  },
);

it("returns whether the Seerr connection is valid", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(getAuthMeHandler(() => HttpResponse.error()));

  const { body } = await gqlServer.executeOperation(
    { query: "query { seerrIsValid }" },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["seerrIsValid"]).toBe(false);
});

const mutation = `
    mutation ($input: SeerrHandleWebhookInput!) {
      seerrHandleWebhook(input: $input)
    }
  `;

const createContext = (gqlContext: GraphQLContext) => {
  const logger = {
    info: vi.fn<(message: string) => void>(),
    warn: vi.fn<(message: string) => void>(),
  };

  return {
    logger,
    contextValue: {
      ...gqlContext,
      logger: logger as unknown as GraphQLContext["logger"],
    },
  };
};

const mediaPayload = (
  notificationType: string,
  media: Record<string, string>,
  extra: { name: string; value: string }[] = [],
) => ({
  notification_type: notificationType,
  media: { imdbId: "", tmdbId: "", tvdbId: "", ...media },
  request: { request_id: "42", requestedBy_email: "user@example.com" },
  extra,
});

it("seerrHandleWebhook acknowledges test notifications without requesting anything", async ({
  gqlContext,
  gqlServer,
}) => {
  const { contextValue, logger } = createContext(gqlContext);

  const { body } = await gqlServer.executeOperation(
    {
      query: mutation,
      variables: {
        input: { payload: { notification_type: "TEST_NOTIFICATION" } },
      },
    },
    { contextValue },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["seerrHandleWebhook"]).toBe(true);
  expect(logger.info).toHaveBeenCalledWith(
    "Seerr webhook notification received",
  );
  expect(contextValue.sendEvent).not.toHaveBeenCalled();
});

it.for(["MEDIA_PENDING", "MEDIA_AVAILABLE", "MEDIA_DECLINED"])(
  "seerrHandleWebhook ignores %s notifications",
  async (notificationType, { gqlContext, gqlServer }) => {
    const { contextValue, logger } = createContext(gqlContext);

    const { body } = await gqlServer.executeOperation(
      {
        query: mutation,
        variables: {
          input: {
            payload: mediaPayload(notificationType, {
              media_type: "movie",
              tmdbId: "550",
            }),
          },
        },
      },
      { contextValue },
    );

    assert.ok(body.kind === "single");

    expect(body.singleResult.errors).toBeUndefined();
    expect(body.singleResult.data?.["seerrHandleWebhook"]).toBe(false);
    expect(logger.warn).toHaveBeenCalledWith(
      `Received unsupported Seerr notification type: ${notificationType}`,
    );
    expect(contextValue.sendEvent).not.toHaveBeenCalled();
  },
);

it.for(["MEDIA_APPROVED", "MEDIA_AUTO_APPROVED"])(
  "seerrHandleWebhook requests the movie from a %s notification",
  async (notificationType, { gqlContext, gqlServer }) => {
    const { contextValue } = createContext(gqlContext);

    const { body } = await gqlServer.executeOperation(
      {
        query: mutation,
        variables: {
          input: {
            payload: mediaPayload(notificationType, {
              media_type: "movie",
              imdbId: "tt0137523",
              tmdbId: "550",
            }),
          },
        },
      },
      { contextValue },
    );

    assert.ok(body.kind === "single");

    expect(body.singleResult.errors).toBeUndefined();
    expect(body.singleResult.data?.["seerrHandleWebhook"]).toBe(true);
    expect(contextValue.sendEvent).toHaveBeenCalledExactlyOnceWith({
      type: "riven-external.item-requested",
      item: {
        type: "movie",
        externalRequestId: "42",
        requestedBy: "user@example.com",
        imdbId: "tt0137523",
        tmdbId: "550",
      },
    });
  },
);

it("seerrHandleWebhook requests the show and its requested seasons", async ({
  gqlContext,
  gqlServer,
}) => {
  const { contextValue } = createContext(gqlContext);

  const { body } = await gqlServer.executeOperation(
    {
      query: mutation,
      variables: {
        input: {
          payload: mediaPayload(
            "MEDIA_APPROVED",
            { media_type: "tv", tmdbId: "1399", tvdbId: "121361" },
            [
              { name: "Requested Seasons", value: "1, 2,3" },
              { name: "Other", value: "ignored" },
            ],
          ),
        },
      },
    },
    { contextValue },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();
  expect(contextValue.sendEvent).toHaveBeenCalledExactlyOnceWith({
    type: "riven-external.item-requested",
    item: {
      type: "show",
      externalRequestId: "42",
      requestedBy: "user@example.com",
      imdbId: null,
      tvdbId: "121361",
      seasons: [1, 2, 3],
    },
  });
});

it("seerrHandleWebhook requests every season of a show when none are listed", async ({
  gqlContext,
  gqlServer,
}) => {
  const { contextValue } = createContext(gqlContext);

  await gqlServer.executeOperation(
    {
      query: mutation,
      variables: {
        input: {
          payload: mediaPayload("MEDIA_AUTO_APPROVED", {
            media_type: "tv",
            tvdbId: "121361",
          }),
        },
      },
    },
    { contextValue },
  );

  expect(contextValue.sendEvent).toHaveBeenCalledExactlyOnceWith({
    type: "riven-external.item-requested",
    item: expect.objectContaining({
      type: "show",
      tvdbId: "121361",
      seasons: undefined,
    }),
  });
});

it("seerrHandleWebhook rejects payloads without the request details", async ({
  gqlContext,
  gqlServer,
}) => {
  const { contextValue } = createContext(gqlContext);

  const { body } = await gqlServer.executeOperation(
    {
      query: mutation,
      variables: {
        input: {
          payload: {
            notification_type: "MEDIA_APPROVED",
            media: { media_type: "movie", tmdbId: "550" },
          },
        },
      },
    },
    { contextValue },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toHaveLength(1);
  expect(contextValue.sendEvent).not.toHaveBeenCalled();
});
