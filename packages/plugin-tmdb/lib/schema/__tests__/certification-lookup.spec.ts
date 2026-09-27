import assert from "node:assert";
import { expect } from "vitest";

import { movieNowPlayingListHandler } from "../../__generated__/handlers/movieNowPlayingListHandler.js";
import { movieReleaseDatesHandler } from "../../__generated__/handlers/movieReleaseDatesHandler.ts";
import { it } from "../../__tests__/tmdb.test-context.ts";

it("returns the localised certification of the media item", async ({
  gqlContext,
  gqlServer,
  server,
}) => {
  server.use(
    movieNowPlayingListHandler({
      results: [
        {
          id: 1,
          title: "Test Movie",
          overview: "Test Overview",
        },
      ],
    }),
    movieReleaseDatesHandler({
      id: 1,
      results: [
        {
          iso_3166_1: "GB",
          release_dates: [
            {
              certification: "12A",
              descriptors: [],
              iso_639_1: "",
              note: "London",
              release_date: "2010-07-08T00:00:00.000Z",
              type: 1,
            },
            {
              certification: "12A",
              descriptors: [],
              iso_639_1: "",
              note: "",
              release_date: "2010-07-16T00:00:00.000Z",
              type: 3,
            },
            {
              certification: "",
              descriptors: [],
              iso_639_1: "",
              note: "Re-release",
              release_date: "2020-08-12T00:00:00.000Z",
              type: 3,
            },
          ],
        },
        {
          iso_3166_1: "IT",
          release_dates: [
            {
              certification: "T",
              descriptors: [],
              iso_639_1: "",
              note: "",
              release_date: "2010-09-24T00:00:00.000Z",
              type: 3,
            },
          ],
        },
        {
          iso_3166_1: "CH",
          release_dates: [
            {
              certification: "14",
              descriptors: [],
              iso_639_1: "de",
              note: "",
              release_date: "2010-07-29T00:00:00.000Z",
              type: 3,
            },
            {
              certification: "14",
              descriptors: [],
              iso_639_1: "it",
              note: "",
              release_date: "2010-09-24T00:00:00.000Z",
              type: 3,
            },
            {
              certification: "14",
              descriptors: [],
              iso_639_1: "fr",
              note: "",
              release_date: "2010-07-21T00:00:00.000Z",
              type: 3,
            },
          ],
        },
      ],
    }),
  );

  const { body } = await gqlServer.executeOperation<{
    tmdbNowPlaying: {
      enGBCertification: string;
      itITCertification: string;
      deCHCertification: string;
      itCHCertification: string;
      frCHCertification: string;
    }[];
  }>(
    {
      query: `
        query TmdbNowPlaying {
          tmdbNowPlayingEnGB: tmdbNowPlaying {
            certification(locale: "en-GB")
          }
          tmdbNowPlayingItIT: tmdbNowPlaying {
            certification(locale: "it-IT")
          }
          tmdbNowPlaying {
            enGBCertification: certification(locale: "en-GB")
            itITCertification: certification(locale: "it-IT")
            deCHCertification: certification(locale: "de-CH")
            itCHCertification: certification(locale: "it-CH")
            frCHCertification: certification(locale: "fr-CH")
          }
        }
      `,
    },
    { contextValue: gqlContext },
  );

  assert.ok(body.kind === "single");

  expect(body.singleResult.errors).toBeUndefined();

  expect(body.singleResult.data?.tmdbNowPlaying[0]).toMatchObject({
    enGBCertification: "12A",
    itITCertification: "T",
    deCHCertification: "14",
    itCHCertification: "14",
    frCHCertification: "14",
  });
});
