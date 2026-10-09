import preview from "@/.storybook/preview";

import { graphql, HttpResponse } from "msw";

import { GET_ITEM_CAST } from "./_components/item-cast/_queries/get-item-cast.query";
import { GET_ITEM_RECOMMENDATIONS } from "./_components/item-recommendations/_queries/get-item-recommendations.query";
import { GET_SIMILAR_ITEMS } from "./_components/similar-items/_queries/get-similar-items.query";
import { MediaDetailsPage } from "./page.client";

const meta = preview.meta({
  title: "Pages / SingleMediaItem",
  component: MediaDetailsPage,
});

export const UnrequestedMovie = meta.story({
  beforeEach({ msw }) {
    msw.use(
      graphql.query(GET_ITEM_CAST, () =>
        HttpResponse.json({
          data: {
            tmdbItem: {
              __typename: "TmdbIndexerData",
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
    );
  },
  args: {
    data: {
      id: "1",
      title: "It",
      overview:
        "In a small town in Maine, seven children known as The Losers Club come face to face with life problems, bullies and a monster that takes the shape of a clown called Pennywise.",
      backdropUrl:
        "https://image.tmdb.org/t/p/w1920/9E2y5Q7WlCVNEhP5GiVTjhEhx1o.jpg",
      logoUrl:
        "https://image.tmdb.org/t/p/w500/nxUlI9IPiieWnzHviapG0akZkz8.png",
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
          id: "genre-1",
          name: "Horror",
        },
      ],
      ratings: {},
      status: "released",

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
      // mediaDetails: {
      // },
    },
  },
});

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
