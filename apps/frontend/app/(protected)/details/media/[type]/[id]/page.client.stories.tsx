import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { HttpResponse } from "msw";
import { startTransition, useEffect, useState } from "react";
import { expect, waitFor, within } from "storybook/test";

import preview from "#.storybook/preview.tsx";
import { GET_MEDIA_ITEM_ACTIONS } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/_queries/get-media-item-actions.query.ts";
import { ON_ITEM_REQUEST_CHANGED } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/_subscriptions/on-item-request-changed.subscription.ts";
import { DELETE_ITEM_REQUEST } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/actions/delete-item/_mutations/delete-item-request.mutation.ts";
import { PAUSE_ITEM } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/actions/pause-item/_mutations/pause-item.mutation.ts";
import { REQUEST_ITEM } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/actions/request-item/_mutations/request-item.mutation.ts";
import { RESET_ITEM } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/actions/reset-item/_mutations/reset-item.mutation.ts";
import { RESUME_ITEM } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/actions/resume-item/_mutations/resume-item.mutation.ts";
import { RETRY_ITEM } from "#app/(protected)/details/media/[type]/[id]/_components/item-action-toolbar/actions/retry-item/_mutations/retry-item.mutation.ts";
import { GET_ITEM_CAST } from "#app/(protected)/details/media/[type]/[id]/_components/item-cast/_queries/get-item-cast.query.ts";
import { GET_ITEM_RECOMMENDATIONS } from "#app/(protected)/details/media/[type]/[id]/_components/item-recommendations/_queries/get-item-recommendations.query.ts";
import { GET_ITEM_SEASON_STATES } from "#app/(protected)/details/media/[type]/[id]/_components/item-seasons/_queries/get-item-season-states.query.ts";
import { GET_ITEM_SEASONS } from "#app/(protected)/details/media/[type]/[id]/_components/item-seasons/_queries/get-item-seasons.query.ts";
import { ON_SEASON_UPDATED } from "#app/(protected)/details/media/[type]/[id]/_components/item-seasons/_subscriptions/on-season-updated.subscription.ts";
import { GET_SIMILAR_ITEMS } from "#app/(protected)/details/media/[type]/[id]/_components/similar-items/_queries/get-similar-items.query.ts";
import { GET_MEDIA_ITEM } from "#app/(protected)/details/media/[type]/[id]/_queries/get-media-item.query.ts";
import { MediaDetailsPage } from "#app/(protected)/details/media/[type]/[id]/page.client.tsx";
import { GET_ITEM_STATE } from "#components/item-state-badge/_queries/get-item-state.query.ts";
import { ON_MEDIA_ITEM_STATE_CHANGED } from "#components/item-state-badge/_subscriptions/on-media-item-state-changed.subscription.ts";
import { api } from "#mocks/graphql.ts";
import { createHasPermissionHandler } from "#mocks/handlers/has-permission.handler.ts";

import { BLACKLIST_ACTIVE_STREAM } from "./_components/item-action-toolbar/actions/blacklist-active-stream/_mutations/blacklist-active-stream.mutation";

import type { SeasonState } from "#app/(protected)/details/media/[type]/[id]/_components/item-seasons/_components/season-card/season-card.tsx";
import type { GetItemSeasonStatesQuery } from "#app/(protected)/details/media/[type]/[id]/_components/item-seasons/_queries/get-item-season-states.query.typegen.ts";
import type { GetMediaItemQuery } from "#app/(protected)/details/media/[type]/[id]/_queries/get-media-item.query.typegen.ts";
import type {
  MediaItemAction,
  MediaItem,
} from "#app/_types/__generated__/graphql.ts";
import type { query, resetClient } from "#lib/graphql/__mocks__/client.ts";
import type { TypedDocumentNode } from "@apollo/client";
import type { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import type { TopLevelMediaItemType } from "@repo/util-plugin-sdk/dto/enums/top-level-media-item-type.enum";
import type { StoryContext } from "@storybook/nextjs-vite";
import type { GraphQLQuery } from "msw/graphql";
import type { ComponentProps } from "react";

//#region Helpers
/**
 * Mocks a mutation on a single entity, failing it if it doesn't target the expected ID.
 *
 * @param onSuccess - Called when the mutation succeeds, e.g. to publish the resulting state change
 */
const mockMutationWithIdEqualityCheck = <
  Mutation extends GraphQLQuery,
  Variables extends { id: string },
>(
  document: TypedDocumentNode<Mutation, Variables>,
  expectedId: string,
  data: Mutation,
  onSuccess?: () => void,
) =>
  api.mutation(document, ({ variables }) => {
    if (variables.id !== expectedId) {
      return HttpResponse.json({
        errors: [{ message: `Invalid id parameter: ${variables.id}` }],
      });
    }

    onSuccess?.();

    return HttpResponse.json({ data });
  });

type RequestedMediaItem = Pick<MediaItem, "id" | "isRequested" | "state">;

/**
 * Mocks a media item's state, and the subscription to its state changes.
 *
 * @returns The mocked handlers, and a function that changes the item's state and notifies its subscribers
 */
const mockItemState = (
  __typename: Capitalize<TopLevelMediaItemType>,
  { id, isRequested, state: initialState }: RequestedMediaItem,
) => {
  let currentState = initialState;

  const subscribers = new Set<() => void>();

  return {
    publishState: (state: MediaItemState) => {
      currentState = state;

      for (const notify of subscribers) {
        notify();
      }
    },
    handlers: [
      api.query(GET_ITEM_STATE, () =>
        HttpResponse.json({
          data: {
            mediaItemById: { __typename, isRequested, state: currentState },
          },
        }),
      ),
      api.subscription(
        ON_MEDIA_ITEM_STATE_CHANGED,
        ({ subscription, finalize }) => {
          if (subscription.variables.id !== id) {
            subscription.error([
              {
                message: `Invalid id parameter: ${subscription.variables.id}`,
              },
            ]);

            return;
          }

          const notify = () => {
            subscription.publish({
              data: {
                mediaItemStateChanged: { __typename, state: currentState },
              },
            });
          };

          subscribers.add(notify);

          finalize(() => {
            subscribers.delete(notify);
          });

          // Catch up on any changes made before the subscription was established
          if (currentState !== initialState) {
            notify();
          }
        },
      ),
    ],
  };
};

/**
 * Mocks the item request queries for a movie that has been requested.
 *
 * @returns The mocked handlers, the IDs they use, and a function to publish state changes
 */
const mockRequestedMovie = ({
  availableActions,
  mediaItem,
}: {
  availableActions: MediaItemAction[];
  mediaItem: RequestedMediaItem;
}) => {
  const itemRequestId = crypto.randomUUID();
  const { id: primaryMediaItemId } = mediaItem;
  const itemState = mockItemState("Movie", mediaItem);

  return {
    itemRequestId,
    primaryMediaItemId,
    publishState: itemState.publishState,
    handlers: [
      api.query(GET_MEDIA_ITEM_ACTIONS, () =>
        HttpResponse.json({
          data: {
            itemRequestByExternalIds: {
              __typename: "ItemRequest",
              id: itemRequestId,
              mediaItem: {
                __typename: "Movie",
                id: primaryMediaItemId,
                availableActions,
              },
              seasons: null,
            },
          },
        }),
      ),
      ...itemState.handlers,
    ],
  };
};

const SEASON_POSTER_URLS = [
  "https://artworks.thetvdb.com/banners/v4/season/830385/posters/6187fabf54442.jpg",
  "https://artworks.thetvdb.com/banners/v4/season/2033977/posters/6791509cb5fcd.jpg",
];

const mockItemSeasonStates = (
  itemRequest: GetItemSeasonStatesQuery["itemRequestByExternalIds"],
) =>
  api.query(GET_ITEM_SEASON_STATES, () =>
    HttpResponse.json({ data: { itemRequestByExternalIds: itemRequest } }),
  );

/**
 * Mocks a show's seasons, none of which have been indexed, and the subscription to their updates.
 */
const mockItemSeasons = (showId: string) => [
  api.query(GET_ITEM_SEASONS, () =>
    HttpResponse.json({
      data: {
        tmdbItem: {
          __typename: "TmdbIndexerData",
          id: showId,
          type: "show",
          seasons: SEASON_POSTER_URLS.map((posterUrl, index) => {
            const number = index + 1;

            return {
              __typename: "IndexerSeason",
              id: `${showId}:season-${String(number)}`,
              number,
              title: `Season ${String(number)}`,
              posterUrl,
              episodes: Array.from({ length: 9 }).map((_, episodeIndex) => ({
                __typename: "IndexerEpisode",
                id: `${showId}:season-${String(number)}:episode-${String(episodeIndex + 1)}`,
                number: episodeIndex + 1,
                title: `Episode ${String(episodeIndex + 1)}`,
                posterUrl: null,
              })),
            };
          }),
        },
      },
    }),
  ),
  mockItemSeasonStates(null),
  api.subscription(ON_SEASON_UPDATED, () => {
    // The seasons don't change
  }),
];

/**
 * Mocks the item request queries for a show that has been requested.
 *
 * @returns The mocked handlers, the IDs they use, and a function to publish state changes
 */
const mockRequestedShow = ({
  availableActions,
  mediaItem,
  seasons,
}: {
  availableActions: MediaItemAction[];
  mediaItem: RequestedMediaItem;
  /**
   * The state of each season's media item, or `null` if the season hasn't been indexed
   */
  seasons: (SeasonState | null)[];
}) => {
  const itemRequestId = crypto.randomUUID();
  const primaryMediaItemId = mediaItem.id;
  const itemState = mockItemState("Show", mediaItem);

  return {
    itemRequestId,
    primaryMediaItemId,
    publishState: itemState.publishState,
    handlers: [
      api.query(GET_MEDIA_ITEM_ACTIONS, () =>
        HttpResponse.json({
          data: {
            itemRequestByExternalIds: {
              __typename: "ItemRequest",
              id: itemRequestId,
              mediaItem: {
                __typename: "Show",
                id: primaryMediaItemId,
                availableActions,
              },
              seasons: null,
            },
          },
        }),
      ),
      mockItemSeasonStates({
        __typename: "ItemRequest",
        id: itemRequestId,
        primaryMediaItem: {
          __typename: "Show",
          id: primaryMediaItemId,
          seasons: seasons.flatMap((season, index) =>
            season
              ? [
                  {
                    __typename: "Season",
                    id: crypto.randomUUID(),
                    number: index + 1,
                    ...season,
                  },
                ]
              : [],
          ),
        },
      }),
      ...itemState.handlers,
    ],
  };
};

type MediaDetailsData = ComponentProps<typeof MediaDetailsPage>["data"];

/**
 * How long Riven takes to process an item request in the background.
 *
 * Changes are published after this, so the mutation that triggered them has responded first, as it would in reality.
 */
const ITEM_REQUEST_PROCESSING_MS = 100;

/**
 * Mocks the subscription to changes in the item's request.
 *
 * @returns The mocked handler, and a function that publishes a change once the request has been processed
 */
const mockItemRequestChanges = (externalId: string) => {
  const subscribers = new Set<(itemRequestId: string) => void>();

  return {
    publishChange: (itemRequestId: string) => {
      setTimeout(() => {
        for (const notify of subscribers) {
          notify(itemRequestId);
        }
      }, ITEM_REQUEST_PROCESSING_MS);
    },
    handler: api.subscription(
      ON_ITEM_REQUEST_CHANGED,
      ({ subscription, finalize }) => {
        const { tmdbId, tvdbId } = subscription.variables;

        if ((tmdbId ?? tvdbId) !== externalId) {
          subscription.error([
            { message: `Invalid external ID: ${String(tmdbId ?? tvdbId)}` },
          ]);

          return;
        }

        const notify = (itemRequestId: string) => {
          subscription.publish({ data: { itemRequestChanged: itemRequestId } });
        };

        subscribers.add(notify);

        finalize(() => {
          subscribers.delete(notify);
        });
      },
    ),
  };
};

/**
 * Mocks the item query the route renders the page with, which is re-fetched when the page refreshes.
 *
 * Matched by name, as the stories' data has the page's props type, which is looser than the query's.
 */
const mockMediaItemQuery = (
  data: MediaDetailsData,
  mediaItem: GetMediaItemQuery["tmdbItem"]["mediaItem"],
) =>
  api.query("GetMediaItem", () =>
    HttpResponse.json({
      data: {
        tmdbItem: { ...data, __typename: "TmdbIndexerData", mediaItem },
      },
    }),
  );

/**
 * Renders the page, emulating `router.refresh()` by re-fetching the item like the route does.
 *
 * Storybook can't re-render server components on a server, so the page is re-rendered in a transition instead,
 * with a fresh GraphQL client as `registerApolloClient` creates one per request. Like a real refresh, this keeps
 * the existing DOM (so mount animations don't replay) while the async components re-run.
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
    data: {
      id: "unrequested-movie",
      isRequestable: true,
      title: "It",
      overview:
        "In a small town in Maine, seven children known as The Losers Club come face to face with life problems, bullies and a monster that takes the shape of a clown called Pennywise.",
      backdropUrl:
        "https://image.tmdb.org/t/p/original/qVGpxnjrGlHaSTCqTQI6viBDSfp.jpg",
      logo: {
        __typename: "ItemImage",
        aspectRatio: 1.22,
        height: 407,
        width: 500,
        url: "https://image.tmdb.org/t/p/w500/nxUlI9IPiieWnzHviapG0akZkz8.png",
      },
      posterUrl:
        "https://image.tmdb.org/t/p/w300/9E2y5Q7WlCVNEhP5GiVTjhEhx1o.jpg",
      trailer: {
        __typename: "Trailer",
        id: crypto.randomUUID(),
        name: "Trailer 1",
        site: "YouTube",
        key: "abcd1234",
        url: "https://www.youtube.com/watch?v=abcd1234",
      },
      year: 2017,
      runtime: "150 minutes",
      language: "en",
      certification: "R",
      type: "movie",
      genres: [
        {
          __typename: "Genre",
          id: "27",
          name: "Horror",
        },
        {
          __typename: "Genre",
          id: "53",
          name: "Thriller",
        },
        {
          __typename: "Genre",
          id: "18",
          name: "Drama",
        },
      ],
      ratings: {},
      status: "released",
      budget: 35_000_000,
      revenue: 719_766_009,
      productionCompanies: [
        {
          __typename: "ProductionCompany",
          id: "12",
          logoPath: "/2ycs64eqV5rqKYHyQK0GVoKGvfX.png",
          name: "New Line Cinema",
          originCountry: "US",
        },
        {
          __typename: "ProductionCompany",
          id: "829",
          logoPath: "/iJo9zP5QCKyBsmKSOcvXd6UDNih.png",
          name: "Vertigo Entertainment",
          originCountry: "US",
        },
        {
          __typename: "ProductionCompany",
          id: "2723",
          logoPath: "/rB0dyszYRRR3SAG1tfNRzXoYDYq.png",
          name: "Lin Pictures",
          originCountry: "US",
        },
        {
          __typename: "ProductionCompany",
          id: "87671",
          logoPath: "/kEEGB5Z2XLYeR3AMt3Qds7vMnvM.png",
          name: "KatzSmith Productions",
          originCountry: "US",
        },
      ],
      homepage: "https://example.com",
      imdbId: "tt1234567",
      originCountry: ["US"],
      spokenLanguages: [
        {
          __typename: "SpokenLanguage",
          englishName: "English",
          iso6391Code: "en",
          name: "English",
        },
      ],
      mediaItem: null,
      // filesystemEntries: [
      //   {
      //     __typename: "MediaEntry",
      //     id: crypto.randomUUID() as UUID,
      //     fileSize: {
      //       __typename: "FileSize",
      //       size: 10.5,
      //       units: "GiB",
      //     },
      //     createdAt: DateTime.now().toISO(),
      //     type: "media" as const,
      //     originalFilename: "test-movie.mp4",
      //     plugin: "@repo/plugin-test",
      //   },
      // ],
      // mediaMetadata: null,
    },
  },
  beforeEach({ args, msw }) {
    msw.use(
      api.query(GET_ITEM_CAST, () =>
        HttpResponse.json({
          data: {
            tmdbItem: {
              __typename: "TmdbIndexerData",
              id: args.data.id,
              type: args.data.type,
              cast: [
                {
                  __typename: "CastMember",
                  character: "Bill Denbrough",
                  id: "1",
                  name: "Jaeden Martell",
                  profileUrl:
                    "https://image.tmdb.org/t/p/w185/oR7ZJsOHMNFzM1HeugV4a4qCMSF.jpg",
                },
              ],
            },
          },
        }),
      ),
      api.query(GET_ITEM_RECOMMENDATIONS, () =>
        HttpResponse.json({
          data: {
            tmdbItem: {
              __typename: "TmdbIndexerData",
              id: args.data.id,
              type: args.data.type,
              recommendations: [
                {
                  __typename: "TmdbIndexerData",
                  id: "clown-in-a-cornfield",
                  title: "Clown in a Cornfield",
                  posterUrl:
                    "https://image.tmdb.org/t/p/w300/6ep6gw90TJ8bYvJC6hEDo8SxjoJ.jpg",
                  type: "movie",
                  year: 2023,
                  isRequestable: true,
                },
              ],
            },
          },
        }),
      ),
      api.query(GET_SIMILAR_ITEMS, () =>
        HttpResponse.json({
          data: {
            tmdbItem: {
              __typename: "TmdbIndexerData",
              id: args.data.id,
              type: args.data.type,
              similarItems: [
                {
                  __typename: "TmdbIndexerData",
                  id: "it-chapter-2",
                  title: "It Chapter 2",
                  posterUrl:
                    "https://image.tmdb.org/t/p/w300/zfE0R94v1E8cuKAerbskfD3VfUt.jpg",
                  type: "movie",
                  year: 2019,
                  isRequestable: true,
                },
              ],
            },
          },
        }),
      ),
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
    data: {
      id: "unrequested-show",
      isRequestable: true,
      title: "Arcane",
      overview:
        "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and clashing convictions.",
      backdropUrl:
        "https://image.tmdb.org/t/p/original/sYXLeu5usz6yEz0k00FYvtEdodD.jpg",
      logo: null,
      posterUrl:
        "https://image.tmdb.org/t/p/w300/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
      trailer: {
        __typename: "Trailer",
        id: crypto.randomUUID(),
        name: "Trailer 1",
        site: "YouTube",
        key: "abcd1234",
        url: "https://www.youtube.com/watch?v=abcd1234",
      },
      year: 2021,
      runtime: "",
      language: "en",
      certification: "R",
      type: "show",
      genres: [
        {
          __typename: "Genre",
          id: crypto.randomUUID(),
          name: "Action",
        },
      ],
      ratings: {},
      status: "released",
      budget: 35_000_000,
      revenue: 719_766_009,
      productionCompanies: [
        {
          __typename: "ProductionCompany",
          id: "12",
          logoPath: "/2ycs64eqV5rqKYHyQK0GVoKGvfX.png",
          name: "New Line Cinema",
          originCountry: "US",
        },
        {
          __typename: "ProductionCompany",
          id: "829",
          logoPath: "/iJo9zP5QCKyBsmKSOcvXd6UDNih.png",
          name: "Vertigo Entertainment",
          originCountry: "US",
        },
        {
          __typename: "ProductionCompany",
          id: "2723",
          logoPath: "/rB0dyszYRRR3SAG1tfNRzXoYDYq.png",
          name: "Lin Pictures",
          originCountry: "US",
        },
        {
          __typename: "ProductionCompany",
          id: "87671",
          logoPath: "/kEEGB5Z2XLYeR3AMt3Qds7vMnvM.png",
          name: "KatzSmith Productions",
          originCountry: "US",
        },
      ],
      homepage: "https://example.com",
      imdbId: "tt1234567",
      originCountry: ["US"],
      spokenLanguages: [
        {
          __typename: "SpokenLanguage",
          englishName: "English",
          iso6391Code: "en",
          name: "English",
        },
      ],
      mediaItem: null,
    },
  },
  beforeEach({ args, msw }) {
    msw.use(
      ...mockItemSeasons(args.data.id),
      api.query(GET_ITEM_CAST, () =>
        HttpResponse.json({
          data: {
            tmdbItem: {
              __typename: "TmdbIndexerData",
              id: args.data.id,
              type: args.data.type,
              cast: [
                {
                  __typename: "CastMember",
                  character: "Jinx",
                  name: "Ella Purnell",
                  id: crypto.randomUUID(),
                  profileUrl:
                    "https://artworks.thetvdb.com/banners/v4/actor/599610/photo/673af66279aeb.jpg",
                },
                {
                  __typename: "CastMember",
                  character: "Vi",
                  name: "Hailee Steinfeld",
                  id: crypto.randomUUID(),
                  profileUrl:
                    "https://artworks.thetvdb.com/banners/v4/actor/327453/photo/673b757403cbb.jpg",
                },
              ],
            },
          },
        }),
      ),
      api.query(GET_ITEM_RECOMMENDATIONS, () =>
        HttpResponse.json({
          data: {
            tmdbItem: {
              __typename: "TmdbIndexerData",
              id: args.data.id,
              type: args.data.type,
              recommendations: [],
            },
          },
        }),
      ),
      api.query(GET_SIMILAR_ITEMS, () =>
        HttpResponse.json({
          data: {
            tmdbItem: {
              __typename: "TmdbIndexerData",
              id: args.data.id,
              type: args.data.type,
              similarItems: [],
            },
          },
        }),
      ),
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
