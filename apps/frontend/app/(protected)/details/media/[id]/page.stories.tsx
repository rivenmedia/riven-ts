import preview from "@/.storybook/preview";

import { DateTime } from "luxon";
import { graphql, HttpResponse } from "msw";

import MediaDetailsPage, { GET_MEDIA_ITEM } from "./page";

const meta = preview.meta({
  title: "Pages / SingleMediaItem",
  component: MediaDetailsPage,
});

export const UnrequestedMovie = meta.story({
  beforeEach({ msw }) {
    msw.use(
      graphql.query(GET_MEDIA_ITEM, () =>
        HttpResponse.json({
          data: {
            mediaDetails: {
              details: {
                id: "1234",
                backdropPath:
                  "https://image.tmdb.org/t/p/w1920/9E2y5Q7WlCVNEhP5GiVTjhEhx1o.jpg",
                logo: "https://image.tmdb.org/t/p/w500/nxUlI9IPiieWnzHviapG0akZkz8.png",
                trailer: {
                  id: "1",
                  name: "Trailer 1",
                  site: "YouTube",
                  key: "abcd1234",
                  url: "https://www.youtube.com/watch?v=abcd1234",
                },
                posterPath:
                  "https://image.tmdb.org/t/p/w300/9E2y5Q7WlCVNEhP5GiVTjhEhx1o.jpg",
                year: 2017,
                formattedRuntime: "2h 30m",
                originalLanguage: "en",
                certification: "pg-13",
                status: "Released",
                title: "It",
                overview:
                  "In a small town in Maine, seven children known as The Losers Club come face to face with life problems, bullies and a monster that takes the shape of a clown called Pennywise.",
                recommendations: [
                  {
                    id: "0000-0000-0000-0000-0000",
                    title: "Clown in a Cornfield",
                    posterPath:
                      "https://image.tmdb.org/t/p/w300/6ep6gw90TJ8bYvJC6hEDo8SxjoJ.jpg",
                    type: "movie",
                    year: 2023,
                  },
                ],
                similar: [
                  {
                    id: "0000-0000-0000-0000-0001",
                    title: "It Chapter 2",
                    posterPath:
                      "https://image.tmdb.org/t/p/w300/zfE0R94v1E8cuKAerbskfD3VfUt.jpg",
                    type: "movie",
                    year: 2019,
                  },
                ],
                genres: [
                  {
                    id: "1",
                    name: "Action",
                  },
                ],
                cast: [],
                seasons: null,
              },
              type: "movie",
              completedFileCount: 1,
              filesystemEntries: [
                {
                  id: "0000-0000-0000-0000-0000",
                  fileSize: {
                    size: 10.5,
                    units: "GiB",
                  },
                  createdAt: DateTime.now().toISO(),
                  type: "media" as const,
                  originalFilename: "test-movie.mp4",
                  plugin: "@repo/plugin-test",
                },
              ],
              mediaMetadata: null,
              state: "completed",
              totalFileCount: 1,
            },
          },
        }),
      ),
    );
  },
});

export const UnrequestedShow = meta.story({
  beforeEach({ msw }) {
    msw.use(
      graphql.query(GET_MEDIA_ITEM, () =>
        HttpResponse.json({
          data: {
            mediaDetails: {
              details: {
                id: "1234",
                backdropPath:
                  "https://image.tmdb.org/t/p/original/sYXLeu5usz6yEz0k00FYvtEdodD.jpg",
                logo: null,
                trailer: {
                  id: "1",
                  name: "Trailer 1",
                  site: "YouTube",
                  key: "abcd1234",
                  url: "https://www.youtube.com/watch?v=abcd1234",
                },
                posterPath:
                  "https://image.tmdb.org/t/p/w300/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
                year: 2021,
                formattedRuntime: "",
                originalLanguage: "en",
                certification: "pg-13",
                status: "Released",
                title: "Arcane",
                overview:
                  "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and clashing convictions.",
                recommendations: [],
                similar: [],
                genres: [
                  {
                    id: "1",
                    name: "Action",
                  },
                ],
                cast: [
                  {
                    character: "Jinx",
                    name: "Ella Purnell",
                    id: "",
                    profilePath:
                      "https://artworks.thetvdb.com/banners/v4/actor/599610/photo/673af66279aeb.jpg",
                  },
                  {
                    character: "Vi",
                    name: "Hailee Steinfeld",
                    id: "",
                    profilePath:
                      "https://artworks.thetvdb.com/banners/v4/actor/327453/photo/673b757403cbb.jpg",
                  },
                ],
                seasons: [
                  {
                    completedCount: 8,
                    episodeCount: 8,
                    id: "season-1",
                    name: "Season 1",
                    seasonNumber: 1,
                    image:
                      "https://artworks.thetvdb.com/banners/v4/season/830385/posters/6187fabf54442.jpg",
                    episodes: [],
                  },
                  {
                    completedCount: 8,
                    episodeCount: 8,
                    id: "season-2",
                    name: "Season 2",
                    seasonNumber: 2,
                    image:
                      "https://artworks.thetvdb.com/banners/v4/season/2033977/posters/6791509cb5fcd.jpg",
                    episodes: [],
                  },
                ],
              },
              type: "show",
              completedFileCount: 1,
              filesystemEntries: [],
              mediaMetadata: null,
              state: "completed",
              totalFileCount: 0,
            },
          },
        }),
      ),
    );
  },
});
