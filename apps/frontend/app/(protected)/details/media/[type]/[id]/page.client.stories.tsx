import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { HttpResponse } from "msw";
import { startTransition, useEffect, useState } from "react";
import { expect, waitFor, within } from "storybook/test";

import preview from "#.storybook/preview.tsx";
import { GET_MEDIA_ITEM_ACTIONS } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/_queries/get-media-item-actions.query.ts";
import { DELETE_ITEM_REQUEST } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/actions/delete-item/_mutations/delete-item-request.mutation.ts";
import { PAUSE_ITEM } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/actions/pause-item/_mutations/pause-item.mutation.ts";
import { REQUEST_ITEM } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/actions/request-item/_mutations/request-item.mutation.ts";
import { RESET_ITEM } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/actions/reset-item/_mutations/reset-item.mutation.ts";
import { RESUME_ITEM } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/actions/resume-item/_mutations/resume-item.mutation.ts";
import { RETRY_ITEM } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/actions/retry-item/_mutations/retry-item.mutation.ts";
import { GET_MEDIA_ITEM } from "#app/(protected)/details/media/[type]/[id]/_queries/get-media-item.query.ts";
import {
  movieCast,
  movieRecommendations,
  movieSimilarItems,
  showCast,
  unrequestedMovie,
  unrequestedShow,
} from "#app/(protected)/details/media/[type]/[id]/media-details.fixtures.ts";
import { MediaDetailsPage } from "#app/(protected)/details/media/[type]/[id]/page.client.tsx";
import { api } from "#mocks/graphql.ts";
import { createHasPermissionHandler } from "#mocks/handlers/has-permission.handler.ts";
import {
  mockItemCast,
  mockItemRecommendations,
  mockItemRequestChanges,
  mockItemSeasonStates,
  mockItemSeasons,
  mockMediaItemQuery,
  mockMutationWithIdEqualityCheck,
  mockRequestedMovie,
  mockRequestedShow,
  mockSimilarItems,
} from "#mocks/handlers/media-details.handler.ts";

import { BLACKLIST_ACTIVE_STREAM } from "./_components/item-action-toolbar/actions/blacklist-active-stream/_mutations/blacklist-active-stream.mutation";

import type { query, resetClient } from "#lib/graphql/__mocks__/client.ts";
import type { MediaDetailsData } from "#mocks/handlers/media-details.handler.ts";
import type { StoryContext } from "@storybook/nextjs-vite";

//#region Helpers
/**
 * Renders the page, emulating `router.refresh()` by re-fetching the item like the route does.
 *
 * Storybook can't re-render server components on a server, so the page is re-rendered in a transition instead,
 * with a fresh GraphQL client as `registerApolloClient` creates one per request. Like a real refresh, this keeps
 * the existing DOM (so mount animations don't replay) whilst the async components re-run.
 */
function RefreshablePage({ data: initialData }: { data: MediaDetailsData }) {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    const { refresh } = getRouter();

    const refetch = async () => {
      // The mock is served in place of the real module, so it must be imported via the real path to share its instance
      const mockGraphqlClient =
        (await import("#lib/graphql/client.ts")) as unknown as {
          query: typeof query;
          resetClient: typeof resetClient;
        };

      mockGraphqlClient.resetClient();

      const { data: refreshed } = await mockGraphqlClient.query({
        query: GET_MEDIA_ITEM,
        variables: { id: initialData.id, type: initialData.type },
      });

      if (refreshed) {
        startTransition(() => {
          setData(refreshed.tmdbItem);
        });
      }
    };

    refresh.mockImplementation(() => {
      void refetch();
    });

    return () => {
      refresh.mockReset();
    };
  }, [initialData]);

  return <MediaDetailsPage data={data} />;
}

/**
 * Opens an item action's dialog, then confirms it.
 */
const requestItemSeasons = async (
  {
    canvas,
    canvasElement,
    userEvent,
  }: Pick<StoryContext, "canvas" | "canvasElement" | "userEvent">,
  seasons: Set<number>,
) => {
  await userEvent.click(
    await canvas.findByRole("button", { name: /request/iu }),
  );

  const dialog = within(canvasElement.ownerDocument.body).getByRole(
    "alertdialog",
  );

  for (const season of seasons) {
    await userEvent.click(
      within(dialog).getByRole("checkbox", {
        name: new RegExp(`Season ${season.toString()}`, "iu"),
      }),
    );
  }

  await userEvent.click(
    within(dialog).getByRole("button", { name: /request selected/iu }),
  );
};

/**
 * Opens an item action's dialog, then confirms it.
 */
const confirmItemAction = async (
  {
    canvas,
    canvasElement,
    userEvent,
  }: Pick<StoryContext, "canvas" | "canvasElement" | "userEvent">,
  name: RegExp,
) => {
  await userEvent.click(await canvas.findByRole("button", { name }));

  const dialog = within(canvasElement.ownerDocument.body).getByRole(
    "alertdialog",
  );

  await userEvent.click(within(dialog).getByRole("button", { name }));
};
//#endregion

const meta = preview.meta({
  title: "Pages / SingleMediaItem",
  component: MediaDetailsPage,
  render: (args) => <RefreshablePage {...args} />,
  beforeEach({ args, msw }) {
    msw.use(
      createHasPermissionHandler({
        item: ["delete", "pause", "request", "reset", "resume", "retry"],
      }),
      mockItemRequestChanges(args.data.id).handler,
    );
  },
});

//#region Movie stories
//#region Unrequested movie
export const UnrequestedMovie = meta.story({
  args: {
    data: unrequestedMovie,
  },
  beforeEach({ args, msw }) {
    msw.use(
      mockItemCast(args.data, movieCast),
      mockItemRecommendations(args.data, movieRecommendations),
      mockSimilarItems(args.data, movieSimilarItems),
      api.query(GET_MEDIA_ITEM_ACTIONS, () =>
        HttpResponse.json({ data: { itemRequestByExternalIds: null } }),
      ),
    );

    const itemRequestChanges = mockItemRequestChanges(args.data.id);

    msw.use(
      itemRequestChanges.handler,
      api.mutation(REQUEST_ITEM, () => {
        const mediaItem = {
          id: crypto.randomUUID(),
          state: "indexed",
          isRequested: true,
        } as const;

        const { itemRequestId, handlers } = mockRequestedMovie({
          availableActions: ["delete", "reset", "pause"],
          mediaItem,
        });

        msw.use(
          ...handlers,
          mockMediaItemQuery(args.data, { __typename: "Movie", ...mediaItem }),
        );

        itemRequestChanges.publishChange(itemRequestId);

        return HttpResponse.json({ data: { requestItem: true } });
      }),
    );
  },
});

UnrequestedMovie.test(
  'Requests the movie when the "Request" button is clicked',
  async ({ canvas, context }) => {
    await confirmItemAction(context, /request/iu);

    await expect(
      await canvas.findByText(/request successful/iu),
    ).toBeInTheDocument();

    await expect(
      await canvas.findByRole("status", { name: /indexed/iu }),
    ).toBeInTheDocument();

    await expect(
      await canvas.findByRole("button", { name: /delete/iu }),
    ).toBeInTheDocument();
  },
);
//#endregion

//#region Completed movie
export const CompletedMovie = UnrequestedMovie.extend({
  args: {
    data: {
      ...UnrequestedMovie.input.args.data,
      id: "completed-movie",
      mediaItem: {
        id: crypto.randomUUID(),
        state: "completed",
        isRequested: true,
      },
    },
  },
  beforeEach({ args, msw }) {
    expect.assert(args.data.mediaItem);

    const { itemRequestId, primaryMediaItemId, publishState, handlers } =
      mockRequestedMovie({
        availableActions: [
          "delete",
          "reset",
          "retry",
          "blacklist_active_stream",
        ],
        mediaItem: args.data.mediaItem,
      });

    const itemRequestChanges = mockItemRequestChanges(args.data.id);

    msw.use(
      ...handlers,
      itemRequestChanges.handler,
      mockMutationWithIdEqualityCheck(
        DELETE_ITEM_REQUEST,
        itemRequestId,
        { removeItemRequest: true },
        () => {
          msw.use(
            api.query(GET_MEDIA_ITEM_ACTIONS, () =>
              HttpResponse.json({ data: { itemRequestByExternalIds: null } }),
            ),
            mockMediaItemQuery(args.data, null),
            mockItemSeasonStates(null),
          );

          itemRequestChanges.publishChange(itemRequestId);
        },
      ),
      mockMutationWithIdEqualityCheck(
        RESET_ITEM,
        primaryMediaItemId,
        {
          resetMediaItem: [
            {
              __typename: "Movie",
              id: primaryMediaItemId,
              state: "indexed",
            },
          ],
        },
        () => {
          publishState("indexed");
        },
      ),
      mockMutationWithIdEqualityCheck(
        RETRY_ITEM,
        primaryMediaItemId,
        {
          retryMediaItem: {
            __typename: "Movie",
            id: primaryMediaItemId,
            state: "indexed",
          },
        },
        () => {
          publishState("indexed");
        },
      ),
      mockMutationWithIdEqualityCheck(
        BLACKLIST_ACTIVE_STREAM,
        primaryMediaItemId,
        { blacklistActiveStream: true },
        () => {
          publishState("scraped");
        },
      ),
    );
  },
});

CompletedMovie.test(
  'Resets the item when the "Reset" button is clicked',
  async ({ canvas, context }) => {
    await confirmItemAction(context, /reset/iu);

    await expect(
      await canvas.findByText(/reset successful/iu),
    ).toBeInTheDocument();

    await expect(
      await canvas.findByRole("status", { name: /indexed/iu }),
    ).toBeInTheDocument();
  },
);

CompletedMovie.test(
  'Retries the item when the "Retry" button is clicked',
  async ({ canvas, context }) => {
    await confirmItemAction(context, /retry/iu);

    await expect(
      await canvas.findByText(/item retried successfully/iu),
    ).toBeInTheDocument();

    await expect(
      await canvas.findByRole("status", { name: /indexed/iu }),
    ).toBeInTheDocument();
  },
);

CompletedMovie.test(
  'Deletes the item when the "Delete" button is clicked',
  async ({ canvas, context }) => {
    await confirmItemAction(context, /delete/iu);

    await expect(
      await canvas.findByText(/item deleted successfully/iu),
    ).toBeInTheDocument();

    await expect(
      await canvas.findByRole("button", { name: /request/iu }),
    ).toBeInTheDocument();

    await waitFor(async () => {
      await expect(
        canvas.queryByRole("status", { name: /completed/iu }),
      ).not.toBeInTheDocument();
    });
  },
);

CompletedMovie.test(
  'Blacklists the active stream when the "Blacklist Active Stream" button is clicked',
  async ({ canvas, context }) => {
    await confirmItemAction(context, /blacklist active stream/iu);

    await expect(
      await canvas.findByText(/active stream blacklisted successfully/iu),
    ).toBeInTheDocument();

    await expect(
      await canvas.findByRole("status", { name: /scraped/iu }),
    ).toBeInTheDocument();
  },
);

CompletedMovie.test(
  'Shows an error when the "Blacklist Active Stream" action fails',
  async ({ args, canvas, canvasElement, msw, userEvent, context }) => {
    expect.assert(args.data.mediaItem);

    msw.use(
      mockMutationWithIdEqualityCheck(
        BLACKLIST_ACTIVE_STREAM,
        args.data.mediaItem.id,
        { blacklistActiveStream: false },
      ),
    );

    await confirmItemAction(context, /blacklist active stream/iu);

    await expect(
      await within(canvasElement.ownerDocument.body).findByText(
        /failed to blacklist the active stream/iu,
      ),
    ).toBeInTheDocument();

    const dialog = await within(canvasElement.ownerDocument.body).findByRole(
      "alertdialog",
      { name: /blacklisting/iu },
    );

    await userEvent.click(
      within(dialog).getByRole("button", { name: /cancel/iu }),
    );

    await expect(
      await canvas.findByRole("status", { name: /completed/iu }),
    ).toBeInTheDocument();
  },
);
//#endregion

//#region Paused movie
export const PausedMovie = UnrequestedMovie.extend({
  args: {
    data: {
      ...UnrequestedMovie.input.args.data,
      id: "paused-movie",
      mediaItem: {
        id: crypto.randomUUID(),
        state: "paused",
        isRequested: true,
      },
    },
  },
  beforeEach({ args, msw }) {
    expect.assert(args.data.mediaItem);

    const { primaryMediaItemId, publishState, handlers } = mockRequestedMovie({
      availableActions: ["delete", "reset", "resume"],
      mediaItem: args.data.mediaItem,
    });

    msw.use(
      ...handlers,
      mockMutationWithIdEqualityCheck(
        RESUME_ITEM,
        primaryMediaItemId,
        {
          resumeMediaItem: {
            __typename: "Movie",
            id: primaryMediaItemId,
            state: "scraped",
          },
        },
        () => {
          publishState("scraped");
        },
      ),
    );
  },
});

PausedMovie.test(
  'Resumes the item when the "Resume" button is clicked',
  async ({ canvas, context }) => {
    await confirmItemAction(context, /resume/iu);

    await expect(
      await canvas.findByText(/item resumed successfully/iu),
    ).toBeInTheDocument();

    await expect(
      await canvas.findByRole("status", { name: /scraped/iu }),
    ).toBeInTheDocument();
  },
);
//#endregion

//#region Scraped movie
export const ScrapedMovie = UnrequestedMovie.extend({
  args: {
    data: {
      ...UnrequestedMovie.input.args.data,
      id: "scraped-movie",
      mediaItem: {
        id: crypto.randomUUID(),
        state: "scraped",
        isRequested: true,
      },
    },
  },
  beforeEach({ args, msw }) {
    expect.assert(args.data.mediaItem);

    const { primaryMediaItemId, publishState, handlers } = mockRequestedMovie({
      availableActions: ["delete", "reset", "pause"],
      mediaItem: args.data.mediaItem,
    });

    msw.use(
      ...handlers,
      mockMutationWithIdEqualityCheck(
        PAUSE_ITEM,
        primaryMediaItemId,
        {
          pauseMediaItem: {
            __typename: "Movie",
            id: primaryMediaItemId,
            state: "paused",
          },
        },
        () => {
          publishState("paused");
        },
      ),
    );
  },
});

ScrapedMovie.test(
  'Pauses the item when the "Pause" button is clicked',
  async ({ canvas, context }) => {
    await confirmItemAction(context, /pause/iu);

    await expect(
      await canvas.findByText(/item paused successfully/iu),
    ).toBeInTheDocument();

    await expect(
      await canvas.findByRole("status", { name: /paused/iu }),
    ).toBeInTheDocument();
  },
);
//#endregion
//#endregion

//#region Show stories
//#region Unrequested show
export const UnrequestedShow = meta.story({
  args: {
    data: unrequestedShow,
  },
  beforeEach({ args, msw }) {
    msw.use(
      ...mockItemSeasons(args.data.id),
      mockItemCast(args.data, showCast),
      mockItemRecommendations(args.data, []),
      mockSimilarItems(args.data, []),
      api.query(GET_MEDIA_ITEM_ACTIONS, () =>
        HttpResponse.json({ data: { itemRequestByExternalIds: null } }),
      ),
    );

    const itemRequestChanges = mockItemRequestChanges(args.data.id);

    msw.use(
      itemRequestChanges.handler,
      api.mutation(REQUEST_ITEM, () => {
        const mediaItem = {
          id: crypto.randomUUID(),
          state: "indexed",
          isRequested: true,
        } as const;

        const { itemRequestId, handlers } = mockRequestedShow({
          availableActions: ["delete", "reset", "pause"],
          mediaItem,
          seasons: [
            { state: "indexed", isRequested: true, completedEpisodeCount: 0 },
            null,
          ],
        });

        msw.use(
          ...handlers,
          mockMediaItemQuery(args.data, { __typename: "Show", ...mediaItem }),
        );

        itemRequestChanges.publishChange(itemRequestId);

        return HttpResponse.json({ data: { requestItem: true } });
      }),
    );
  },
});

UnrequestedShow.test(
  'Requests the show when the "Request" button is clicked',
  async ({ canvas, context }) => {
    await requestItemSeasons(context, new Set([1]));

    await expect(
      await canvas.findByText(/request successful/iu),
    ).toBeInTheDocument();

    // The show and its requested season are both indexed
    await waitFor(async () => {
      await expect(
        canvas.getAllByRole("status", { name: /indexed/iu }),
      ).toHaveLength(2);
    });

    await expect(
      await canvas.findByRole("button", { name: /delete/iu }),
    ).toBeInTheDocument();
  },
);

UnrequestedShow.test(
  "Links each season to its season page",
  async ({ canvas }) => {
    await expect(
      await canvas.findByRole("link", { name: /season 2/iu }),
    ).toHaveAttribute("href", "/details/media/show/unrequested-show/seasons/2");
  },
);
//#endregion

//#region Completed show
export const CompletedShow = UnrequestedShow.extend({
  args: {
    data: {
      ...UnrequestedShow.input.args.data,
      id: "completed-show",
      mediaItem: {
        id: crypto.randomUUID(),
        state: "completed",
        isRequested: true,
      },
    },
  },
  beforeEach({ args, msw }) {
    expect.assert(args.data.mediaItem);

    const { itemRequestId, primaryMediaItemId, publishState, handlers } =
      mockRequestedShow({
        availableActions: ["delete", "reset", "retry"],
        mediaItem: args.data.mediaItem,
        seasons: [
          { state: "completed", isRequested: true, completedEpisodeCount: 9 },
          { state: "completed", isRequested: true, completedEpisodeCount: 9 },
        ],
      });

    const itemRequestChanges = mockItemRequestChanges(args.data.id);

    msw.use(
      ...handlers,
      itemRequestChanges.handler,
      mockMutationWithIdEqualityCheck(
        DELETE_ITEM_REQUEST,
        itemRequestId,
        { removeItemRequest: true },
        () => {
          msw.use(
            api.query(GET_MEDIA_ITEM_ACTIONS, () =>
              HttpResponse.json({ data: { itemRequestByExternalIds: null } }),
            ),
            mockMediaItemQuery(args.data, null),
            mockItemSeasonStates(null),
          );

          itemRequestChanges.publishChange(itemRequestId);
        },
      ),
      mockMutationWithIdEqualityCheck(
        RESET_ITEM,
        primaryMediaItemId,
        {
          resetMediaItem: [
            {
              __typename: "Show",
              id: primaryMediaItemId,
              state: "indexed",
            },
          ],
        },
        () => {
          publishState("indexed");
        },
      ),
      mockMutationWithIdEqualityCheck(
        RETRY_ITEM,
        primaryMediaItemId,
        {
          retryMediaItem: {
            __typename: "Show",
            id: primaryMediaItemId,
            state: "indexed",
          },
        },
        () => {
          publishState("indexed");
        },
      ),
    );
  },
});

CompletedShow.test(
  'Resets the item when the "Reset" button is clicked',
  async ({ canvas, context }) => {
    await confirmItemAction(context, /reset/iu);

    await expect(
      await canvas.findByText(/reset successful/iu),
    ).toBeInTheDocument();

    await expect(
      await canvas.findByRole("status", { name: /indexed/iu }),
    ).toBeInTheDocument();
  },
);

CompletedShow.test(
  'Retries the item when the "Retry" button is clicked',
  async ({ canvas, context }) => {
    await confirmItemAction(context, /retry/iu);

    await expect(
      await canvas.findByText(/item retried successfully/iu),
    ).toBeInTheDocument();

    await expect(
      await canvas.findByRole("status", { name: /indexed/iu }),
    ).toBeInTheDocument();
  },
);

CompletedShow.test(
  'Deletes the item when the "Delete" button is clicked',
  async ({ canvas, context }) => {
    await confirmItemAction(context, /delete/iu);

    await expect(
      await canvas.findByText(/item deleted successfully/iu),
    ).toBeInTheDocument();

    await expect(
      await canvas.findByRole("button", { name: /request/iu }),
    ).toBeInTheDocument();

    await waitFor(async () => {
      await expect(
        canvas.queryByRole("status", { name: /completed/iu }),
      ).not.toBeInTheDocument();
    });
  },
);
//#endregion

//#region Paused show
export const PausedShow = UnrequestedShow.extend({
  args: {
    data: {
      ...UnrequestedShow.input.args.data,
      id: "paused-show",
      mediaItem: {
        id: crypto.randomUUID(),
        state: "paused",
        isRequested: true,
      },
    },
  },
  beforeEach({ args, msw }) {
    expect.assert(args.data.mediaItem);

    const { primaryMediaItemId, publishState, handlers } = mockRequestedShow({
      availableActions: ["delete", "reset", "resume"],
      mediaItem: args.data.mediaItem,
      seasons: [
        { state: "completed", isRequested: true, completedEpisodeCount: 9 },
        { state: "paused", isRequested: true, completedEpisodeCount: 5 },
      ],
    });

    msw.use(
      ...handlers,
      mockMutationWithIdEqualityCheck(
        RESUME_ITEM,
        primaryMediaItemId,
        {
          resumeMediaItem: {
            __typename: "Show",
            id: primaryMediaItemId,
            state: "scraped",
          },
        },
        () => {
          publishState("scraped");
        },
      ),
    );
  },
});

PausedShow.test(
  'Resumes the item when the "Resume" button is clicked',
  async ({ canvas, context }) => {
    await confirmItemAction(context, /resume/iu);

    await expect(
      await canvas.findByText(/item resumed successfully/iu),
    ).toBeInTheDocument();

    await expect(
      await canvas.findByRole("status", { name: /scraped/iu }),
    ).toBeInTheDocument();
  },
);
//#endregion

//#region Scraped show
export const ScrapedShow = UnrequestedShow.extend({
  args: {
    data: {
      ...UnrequestedShow.input.args.data,
      id: "scraped-show",
      mediaItem: {
        id: crypto.randomUUID(),
        state: "scraped",
        isRequested: true,
      },
    },
  },
  beforeEach({ args, msw }) {
    expect.assert(args.data.mediaItem);

    const { primaryMediaItemId, publishState, handlers } = mockRequestedShow({
      availableActions: ["delete", "reset", "pause"],
      mediaItem: args.data.mediaItem,
      seasons: [
        { state: "scraped", isRequested: true, completedEpisodeCount: 0 },
        { state: "scraped", isRequested: true, completedEpisodeCount: 0 },
      ],
    });

    msw.use(
      ...handlers,
      mockMutationWithIdEqualityCheck(
        PAUSE_ITEM,
        primaryMediaItemId,
        {
          pauseMediaItem: {
            __typename: "Show",
            id: primaryMediaItemId,
            state: "paused",
          },
        },
        () => {
          publishState("paused");
        },
      ),
    );
  },
});

ScrapedShow.test(
  'Pauses the item when the "Pause" button is clicked',
  async ({ canvas, context }) => {
    await confirmItemAction(context, /pause/iu);

    await expect(
      await context.canvas.findByText(/item paused successfully/iu),
    ).toBeInTheDocument();

    await expect(
      await canvas.findByRole("status", { name: /paused/iu }),
    ).toBeInTheDocument();
  },
);
//#endregion

//#endregion
