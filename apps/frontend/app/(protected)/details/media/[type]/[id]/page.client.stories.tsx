import { graphql, HttpResponse } from "msw";
import { expect, within } from "storybook/test";

import preview from "#.storybook/preview.tsx";
import { getSessionHandler } from "#mocks/handlers/get-session.handler.ts";
import { hasPermissionHandler } from "#mocks/handlers/has-permission.handler.ts";

import { GET_ITEM_REQUEST_ACTIONS } from "./_components/item-action-toolbar/_queries/get-item-request-actions.query.ts";
import { DELETE_ITEM_REQUEST } from "./_components/item-action-toolbar/actions/delete-item/_mutations/delete-item-request.mutation.ts";
import { PAUSE_ITEM } from "./_components/item-action-toolbar/actions/pause-item/_mutations/pause-item.mutation.ts";
import { REQUEST_ITEM } from "./_components/item-action-toolbar/actions/request-item/_mutations/request-item.mutation.ts";
import { RESET_ITEM } from "./_components/item-action-toolbar/actions/reset-item/_mutations/reset-item.mutation.ts";
import { RESUME_ITEM } from "./_components/item-action-toolbar/actions/resume-item/_mutations/resume-item.mutation.ts";
import { RETRY_ITEM } from "./_components/item-action-toolbar/actions/retry-item/_mutations/retry-item.mutation.ts";
import { GET_ITEM_CAST } from "./_components/item-cast/_queries/get-item-cast.query.ts";
import { GET_ITEM_RECOMMENDATIONS } from "./_components/item-recommendations/_queries/get-item-recommendations.query.ts";
import { GET_ITEM_STATUS } from "./_components/item-status-badge/_queries/get-item-status.query.ts";
import { GET_SIMILAR_ITEMS } from "./_components/similar-items/_queries/get-similar-items.query.ts";
import { MediaDetailsPage } from "./page.client.tsx";

import type {
  ItemRequestAction,
  MediaItemState,
} from "#app/_types/__generated__/graphql.ts";
import type { TypedDocumentNode } from "@apollo/client";
import type { StoryContext } from "@storybook/nextjs-vite";
import type { GraphQLQuery } from "msw";

//#region Helpers
/**
 * Mocks a mutation on a single entity, failing it if it doesn't target the expected ID.
 */
const mockMutationWithIdEqualityCheck = <
  Mutation extends GraphQLQuery,
  Variables extends { id: string },
>(
  document: TypedDocumentNode<Mutation, Variables>,
  expectedId: string,
  data: Mutation,
) =>
  graphql.mutation(document, ({ variables }) => {
    if (variables.id !== expectedId) {
      return HttpResponse.json({
        errors: [{ message: `Invalid id parameter: ${variables.id}` }],
      });
    }

    return HttpResponse.json({ data });
  });

/**
 * Mocks the item request queries for a movie that has been requested.
 *
 * @returns The mocked handlers, and the IDs they use
 */
const mockRequestedMovie = ({
  state,
  availableActions,
}: {
  state: MediaItemState;
  availableActions: ItemRequestAction[];
}) => {
  const itemRequestId = crypto.randomUUID();
  const primaryMediaItemId = crypto.randomUUID();

  return {
    itemRequestId,
    primaryMediaItemId,
    handlers: [
      graphql.query(GET_ITEM_REQUEST_ACTIONS, () =>
        HttpResponse.json({
          data: {
            itemRequestByExternalIds: {
              __typename: "ItemRequest",
              id: itemRequestId,
              availableActions,
              primaryMediaItem: {
                __typename: "Movie",
                id: primaryMediaItemId,
              },
              seasons: null,
            },
          },
        }),
      ),
      graphql.query(GET_ITEM_STATUS, () =>
        HttpResponse.json({
          data: {
            itemRequestByExternalIds: {
              __typename: "ItemRequest",
              id: itemRequestId,
              primaryMediaItem: {
                __typename: "Movie",
                id: primaryMediaItemId,
                state,
                type: "movie",
              },
            },
          },
        }),
      ),
    ],
  };
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
});

//#region Movie stories
//#region Unrequested movie
export const UnrequestedMovie = meta.story({
  args: {
    data: {
      id: "unrequested-movie",
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
      // seasons: null,
      // type: "movie",
      // completedFileCount: 1,
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
      // state: "completed",
      // totalFileCount: 1,
    },
  },
  beforeEach({ args, msw }) {
    msw.use(
      graphql.query(GET_ITEM_CAST, () =>
        HttpResponse.json({
          data: {
            tmdbItem: {
              __typename: "TmdbIndexerData",
              id: args.data.id,
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
      graphql.query(GET_ITEM_RECOMMENDATIONS, () =>
        HttpResponse.json({
          data: {
            tmdbItem: {
              __typename: "TmdbIndexerData",
              id: args.data.id,
              recommendations: [
                {
                  __typename: "TmdbIndexerData",
                  id: "clown-in-a-cornfield",
                  title: "Clown in a Cornfield",
                  posterUrl:
                    "https://image.tmdb.org/t/p/w300/6ep6gw90TJ8bYvJC6hEDo8SxjoJ.jpg",
                  type: "movie",
                  year: 2023,
                },
              ],
            },
          },
        }),
      ),
      graphql.query(GET_SIMILAR_ITEMS, () =>
        HttpResponse.json({
          data: {
            tmdbItem: {
              __typename: "TmdbIndexerData",
              id: args.data.id,
              similarItems: [
                {
                  __typename: "TmdbIndexerData",
                  id: "it-chapter-2",
                  title: "It Chapter 2",
                  posterUrl:
                    "https://image.tmdb.org/t/p/w300/zfE0R94v1E8cuKAerbskfD3VfUt.jpg",
                  type: "movie",
                  year: 2019,
                },
              ],
            },
          },
        }),
      ),
      graphql.query(GET_ITEM_REQUEST_ACTIONS, () =>
        HttpResponse.json({ data: { itemRequestByExternalIds: null } }),
      ),
      graphql.query(GET_ITEM_STATUS, () =>
        HttpResponse.json({ data: { itemRequestByExternalIds: null } }),
      ),
    );
  },
});

UnrequestedMovie.test(
  'Requests the movie when the "Request" button is clicked',
  async (context) => {
    context.msw.use(
      getSessionHandler,
      hasPermissionHandler,
      graphql.mutation(REQUEST_ITEM, () =>
        HttpResponse.json({ data: { requestItem: true } }),
      ),
    );

    await confirmItemAction(context, /request/iu);

    await expect(
      await context.canvas.findByText(/request successful/iu),
    ).toBeInTheDocument();
  },
);
//#endregion

//#region Completed movie
export const CompletedMovie = UnrequestedMovie.extend({
  args: {
    data: {
      ...UnrequestedMovie.composed.args.data,
      id: "completed-movie",
    },
  },
  beforeEach({ msw }) {
    const { itemRequestId, primaryMediaItemId, handlers } = mockRequestedMovie({
      state: "completed",
      availableActions: ["delete", "reset", "retry"],
    });

    msw.use(
      getSessionHandler,
      hasPermissionHandler,
      ...handlers,
      mockMutationWithIdEqualityCheck(DELETE_ITEM_REQUEST, itemRequestId, {
        removeItemRequest: true,
      }),
      mockMutationWithIdEqualityCheck(RESET_ITEM, primaryMediaItemId, {
        resetMediaItem: [
          {
            __typename: "Movie",
            id: primaryMediaItemId,
            state: "indexed",
          },
        ],
      }),
      mockMutationWithIdEqualityCheck(RETRY_ITEM, primaryMediaItemId, {
        retryMediaItem: {
          __typename: "Movie",
          id: primaryMediaItemId,
          state: "indexed",
        },
      }),
    );
  },
});

CompletedMovie.test(
  'Resets the item when the "Reset" button is clicked',
  async (context) => {
    await confirmItemAction(context, /reset/iu);

    await expect(
      await context.canvas.findByText(/reset successful/iu),
    ).toBeInTheDocument();
  },
);

CompletedMovie.test(
  'Retries the item when the "Retry" button is clicked',
  async (context) => {
    await confirmItemAction(context, /retry/iu);

    await expect(
      await context.canvas.findByText(/item retried successfully/iu),
    ).toBeInTheDocument();
  },
);

CompletedMovie.test(
  'Deletes the item when the "Delete" button is clicked',
  async (context) => {
    await confirmItemAction(context, /delete/iu);

    await expect(
      await context.canvas.findByText(/item deleted successfully/iu),
    ).toBeInTheDocument();
  },
);
//#endregion

//#region Paused movie
export const PausedMovie = UnrequestedMovie.extend({
  args: {
    data: {
      ...UnrequestedMovie.composed.args.data,
      id: "paused-movie",
    },
  },
  beforeEach({ msw }) {
    const { primaryMediaItemId, handlers } = mockRequestedMovie({
      state: "paused",
      availableActions: ["delete", "reset", "resume"],
    });

    msw.use(
      getSessionHandler,
      hasPermissionHandler,
      ...handlers,
      mockMutationWithIdEqualityCheck(RESUME_ITEM, primaryMediaItemId, {
        resumeMediaItem: {
          __typename: "Movie",
          id: primaryMediaItemId,
          state: "scraped",
        },
      }),
    );
  },
});

PausedMovie.test(
  'Resumes the item when the "Resume" button is clicked',
  async (context) => {
    await confirmItemAction(context, /resume/iu);

    await expect(
      await context.canvas.findByText(/item resumed successfully/iu),
    ).toBeInTheDocument();
  },
);
//#endregion

//#region Scraped movie
export const ScrapedMovie = UnrequestedMovie.extend({
  args: {
    data: {
      ...UnrequestedMovie.composed.args.data,
      id: "scraped-movie",
    },
  },
  beforeEach({ msw }) {
    const { primaryMediaItemId, handlers } = mockRequestedMovie({
      state: "scraped",
      availableActions: ["delete", "reset", "pause"],
    });

    msw.use(
      getSessionHandler,
      hasPermissionHandler,
      ...handlers,
      mockMutationWithIdEqualityCheck(PAUSE_ITEM, primaryMediaItemId, {
        pauseMediaItem: {
          __typename: "Movie",
          id: primaryMediaItemId,
          state: "paused",
        },
      }),
    );
  },
});

ScrapedMovie.test(
  'Pauses the item when the "Pause" button is clicked',
  async (context) => {
    await confirmItemAction(context, /pause/iu);

    await expect(
      await context.canvas.findByText(/item paused successfully/iu),
    ).toBeInTheDocument();
  },
);
//#endregion

// export const UnrequestedShow = meta.story({
//   args: {
//     data: {
//       mediaDetails: {
//         __typename: "MediaDetails",
//         details: {
//           __typename: "MediaDetailsDetails",
//           id: crypto.randomUUID() as UUID,
//           backdropPath:
//             "https://image.tmdb.org/t/p/original/sYXLeu5usz6yEz0k00FYvtEdodD.jpg",
//           logo: null,
//           trailer: {
//             __typename: "Trailer",
//             id: crypto.randomUUID() as UUID,
//             name: "Trailer 1",
//             site: "YouTube",
//             key: "abcd1234",
//             url: "https://www.youtube.com/watch?v=abcd1234",
//           },
//           posterPath:
//             "https://image.tmdb.org/t/p/w300/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
//           year: 2021,
//           formattedRuntime: "",
//           originalLanguage: "en",
//           certification: "pg-13",
//           status: "Released",
//           title: "Arcane",
//           overview:
//             "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and clashing convictions.",
//           recommendations: [],
//           similar: [],
//           genres: [
//             {
//               __typename: "Genre",
//               id: crypto.randomUUID() as UUID,
//               name: "Action",
//             },
//           ],
//           cast: [
//             {
//               __typename: "CastMember",
//               character: "Jinx",
//               name: "Ella Purnell",
//               id: crypto.randomUUID() as UUID,
//               profilePath:
//                 "https://artworks.thetvdb.com/banners/v4/actor/599610/photo/673af66279aeb.jpg",
//             },
//             {
//               __typename: "CastMember",
//               character: "Vi",
//               name: "Hailee Steinfeld",
//               id: crypto.randomUUID() as UUID,
//               profilePath:
//                 "https://artworks.thetvdb.com/banners/v4/actor/327453/photo/673b757403cbb.jpg",
//             },
//           ],
//           seasons: [
//             {
//               __typename: "SeasonData",
//               completedCount: 8,
//               episodeCount: 8,
//               id: crypto.randomUUID() as UUID,
//               name: "Season 1",
//               seasonNumber: 1,
//               image:
//                 "https://artworks.thetvdb.com/banners/v4/season/830385/posters/6187fabf54442.jpg",
//             },
//             {
//               __typename: "SeasonData",
//               completedCount: 8,
//               episodeCount: 8,
//               id: crypto.randomUUID() as UUID,
//               name: "Season 2",
//               seasonNumber: 2,
//               image:
//                 "https://artworks.thetvdb.com/banners/v4/season/2033977/posters/6791509cb5fcd.jpg",
//             },
//           ],
//         },
//         type: "show",
//         completedFileCount: 1,
//         filesystemEntries: [],
//         mediaMetadata: null,
//         state: "completed",
//         totalFileCount: 0,
//       },
//     },
//   },
// });
