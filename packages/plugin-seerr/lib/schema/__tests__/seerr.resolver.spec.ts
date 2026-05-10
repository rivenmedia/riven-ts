import { HttpResponse, http } from "msw";
import assert from "node:assert";
import { expect, vi } from "vitest";

import { it } from "../../__tests__/seerr.test-context.ts";

it('returns validation status for "seerrIsValid" query', async ({
  gqlServer,
  server,
  gqlContext,
}) => {
  server.use(
    http.get("**/api/v1/auth/me", () =>
      HttpResponse.json({ id: 1, email: "admin@test.com" }),
    ),
    http.get("**/api/v1/settings/metadatas", () =>
      HttpResponse.json({ tv: "tvdb", anime: "tvdb" }),
    ),
  );

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        query SeerrIsValid {
          seerrIsValid
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert(body.kind === "single");
  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["seerrIsValid"]).toBe(true);
});

it('handles "seerrHandleWebhook" mutation for test notification', async ({
  gqlServer,
  gqlContext,
}) => {
  // The resolver uses ctx.logger.info - ensure gqlContext.logger has info
  const ctx = {
    ...gqlContext,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
  };

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        mutation HandleWebhook($input: SeerrHandleWebhookInput!) {
          seerrHandleWebhook(input: $input)
        }
      `,
      variables: {
        input: {
          payload: {
            notification_type: "TEST_NOTIFICATION",
          },
        },
      },
    },
    { contextValue: ctx },
  );

  assert(body.kind === "single");
  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["seerrHandleWebhook"]).toBe(true);
});

it('handles "seerrHandleWebhook" mutation for movie request', async ({
  gqlServer,
  gqlContext,
}) => {
  const sendEvent = vi.fn();
  const ctx = {
    ...gqlContext,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
    sendEvent,
  };

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        mutation HandleWebhook($input: SeerrHandleWebhookInput!) {
          seerrHandleWebhook(input: $input)
        }
      `,
      variables: {
        input: {
          payload: {
            notification_type: "MEDIA_APPROVED",
            media: {
              media_type: "movie",
              imdbId: "tt1234567",
              tmdbId: "12345",
              tvdbId: "",
            },
            request: {
              request_id: "req-1",
              requestedBy_email: "user@test.com",
            },
            extra: [],
          },
        },
      },
    },
    { contextValue: ctx },
  );

  assert(body.kind === "single");
  expect(body.singleResult.errors).toBeUndefined();
  expect(body.singleResult.data?.["seerrHandleWebhook"]).toBe(true);
  expect(sendEvent).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "riven-external.item-requested",
      item: expect.objectContaining({
        type: "movie",
        tmdbId: "12345",
        imdbId: "tt1234567",
      }),
    }),
  );
});

it('handles "seerrHandleWebhook" mutation for TV request with seasons', async ({
  gqlServer,
  gqlContext,
}) => {
  const sendEvent = vi.fn();
  const ctx = {
    ...gqlContext,
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
    sendEvent,
  };

  const { body } = await gqlServer.executeOperation(
    {
      query: `
        mutation HandleWebhook($input: SeerrHandleWebhookInput!) {
          seerrHandleWebhook(input: $input)
        }
      `,
      variables: {
        input: {
          payload: {
            notification_type: "MEDIA_APPROVED",
            media: {
              media_type: "tv",
              imdbId: "tt9876543",
              tmdbId: "",
              tvdbId: "67890",
            },
            request: {
              request_id: "req-2",
              requestedBy_email: "user@test.com",
            },
            extra: [{ name: "Requested Seasons", value: "1, 2, 3" }],
          },
        },
      },
    },
    { contextValue: ctx },
  );

  assert(body.kind === "single");
  expect(body.singleResult.errors).toBeUndefined();
  expect(sendEvent).toHaveBeenCalledWith(
    expect.objectContaining({
      type: "riven-external.item-requested",
      item: expect.objectContaining({
        type: "show",
        tvdbId: "67890",
        seasons: [1, 2, 3],
      }),
    }),
  );
});
