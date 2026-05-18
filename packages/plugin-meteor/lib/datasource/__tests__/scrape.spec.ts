import { Movie } from "@repo/util-plugin-sdk/dto/entities";

import { HttpResponse, http } from "msw";
import { randomUUID } from "node:crypto";
import { describe, expect } from "vitest";

import { it } from "../../__tests__/meteor.test-context.ts";
import { MeteorAPI } from "../meteor.datasource.ts";

function createMockMovie(imdbId: string): Movie {
  return Object.assign(Object.create(Movie.prototype) as Movie, {
    id: randomUUID(),
    imdbId,
    fullTitle: "Test Movie",
  });
}

describe("scrape", () => {
  it("returns torrents with titles from description (testing format)", async ({
    server,
    dataSourceMap,
  }) => {
    server.use(
      http.get("**/stream/movie/:imdbId.json", () =>
        HttpResponse.json({
          streams: [
            {
              name: "2160p",
              description:
                "\u{1F4C4} Test.Movie.2026.2160p.WEB-DL.DDP5.1.H265-GROUP\n\u2B50 WEB-DL  \u{1F4BE} 28.7 GB\n\u{1F50E} Comet",
              infoHash: "6e62f4db4e3f26aec3b481052f2bcc5d5f311dc9",
              behaviorHints: {
                filename: "Test.Movie.2026.2160p.WEB-DL.DDP5.1.H265-GROUP",
              },
            },
          ],
        }),
      ),
    );

    const api = dataSourceMap.get(MeteorAPI);
    const result = await api.scrape({ item: createMockMovie("tt12042730") });

    expect(result).toStrictEqual({
      "6e62f4db4e3f26aec3b481052f2bcc5d5f311dc9":
        "Test.Movie.2026.2160p.WEB-DL.DDP5.1.H265-GROUP",
    });
  });

  it("falls back to filename when description title is truncated", async ({
    server,
    dataSourceMap,
  }) => {
    server.use(
      http.get("**/stream/movie/:imdbId.json", () =>
        HttpResponse.json({
          streams: [
            {
              name: "[P2P\u2601\uFE0F]\nMeteor\n2160p",
              description:
                "\u{1F4C1} Test.Movie.2026.2160p.WEB-DL.DDP5.1.A...\n\u{1F4FA} 2160p | WEB-DL\n\u{1F4BE} 28.7 GB",
              infoHash: "85a6d9a0bb400bb3d068637d1a831548a52514de",
              behaviorHints: {
                filename:
                  "Test.Movie.2026.2160p.WEB-DL.DDP5.1.Atmos.H265-GROUP",
              },
            },
          ],
        }),
      ),
    );

    const api = dataSourceMap.get(MeteorAPI);
    const result = await api.scrape({ item: createMockMovie("tt12042730") });

    expect(result).toStrictEqual({
      "85a6d9a0bb400bb3d068637d1a831548a52514de":
        "Test.Movie.2026.2160p.WEB-DL.DDP5.1.Atmos.H265-GROUP",
    });
  });

  it("returns empty record when no streams are found", async ({
    server,
    dataSourceMap,
  }) => {
    server.use(
      http.get("**/stream/movie/:imdbId.json", () =>
        HttpResponse.json({ streams: [] }),
      ),
    );

    const api = dataSourceMap.get(MeteorAPI);
    const result = await api.scrape({ item: createMockMovie("tt12042730") });

    expect(result).toStrictEqual({});
  });

  it("returns empty record when the request fails", async ({
    server,
    dataSourceMap,
  }) => {
    server.use(
      http.get("**/stream/movie/:imdbId.json", () => HttpResponse.error()),
    );

    const api = dataSourceMap.get(MeteorAPI);
    const result = await api.scrape({ item: createMockMovie("tt12042730") });

    expect(result).toStrictEqual({});
  });

  it("returns multiple torrents from a single response", async ({
    server,
    dataSourceMap,
  }) => {
    server.use(
      http.get("**/stream/movie/:imdbId.json", () =>
        HttpResponse.json({
          streams: [
            {
              name: "2160p",
              description:
                "\u{1F4C4} First.Title.2026.2160p.WEB-DL\n\u2B50 WEB-DL",
              infoHash: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
              behaviorHints: {},
            },
            {
              name: "1080p",
              description:
                "\u{1F4C4} Second.Title.2026.1080p.WEB-DL\n\u2B50 WEB-DL",
              infoHash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
              behaviorHints: {},
            },
          ],
        }),
      ),
    );

    const api = dataSourceMap.get(MeteorAPI);
    const result = await api.scrape({ item: createMockMovie("tt12042730") });

    expect(result).toStrictEqual({
      aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa: "First.Title.2026.2160p.WEB-DL",
      bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb:
        "Second.Title.2026.1080p.WEB-DL",
    });
  });

  it("uses filename when description has no parseable title", async ({
    server,
    dataSourceMap,
  }) => {
    server.use(
      http.get("**/stream/movie/:imdbId.json", () =>
        HttpResponse.json({
          streams: [
            {
              name: "1080p",
              description: "\u{1F4C1} \n\u{1F4FA} 1080p",
              infoHash: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
              behaviorHints: {
                filename: "Fallback.Title.2026.1080p.WEB-DL",
              },
            },
          ],
        }),
      ),
    );

    const api = dataSourceMap.get(MeteorAPI);
    const result = await api.scrape({ item: createMockMovie("tt12042730") });

    expect(result).toStrictEqual({
      bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb:
        "Fallback.Title.2026.1080p.WEB-DL",
    });
  });
});
