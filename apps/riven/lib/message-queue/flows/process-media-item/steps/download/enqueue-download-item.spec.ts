import { expect } from "vitest";

import { it } from "#__tests__/test-context.ts";

import { enqueueDownloadItem } from "./enqueue-download-item.ts";

it("creates a download job that finds a valid torrent from the ranked streams", async ({
  scrapedMovieContext: { scrapedMovie, streams },
  getFirstAddedFlowJob,
}) => {
  const parent = { id: "parent-id", queue: "bull:process-media-item" };

  await enqueueDownloadItem({ item: scrapedMovie, opts: { parent } });

  const node = getFirstAddedFlowJob();

  expect(node).toMatchObject({
    name: `Downloading ${scrapedMovie.fullTitle}`,
    queueName: "download-item",
    data: { id: scrapedMovie.id },
    opts: { parent, continueParentOnFailure: true },
    children: [
      {
        queueName: "download-item.find-valid-torrent",
        data: {
          id: scrapedMovie.id,
          itemTitle: scrapedMovie.fullTitle,
          failedInfoHashes: [],
        },
        opts: { continueParentOnFailure: true },
        children: [
          {
            queueName: "download-item.rank-streams",
            data: {
              id: scrapedMovie.id,
              streams: Object.fromEntries(
                streams.map(({ infoHash, parsedData }) => [
                  infoHash,
                  parsedData.rawTitle,
                ]),
              ),
            },
          },
        ],
      },
    ],
  });
  expect(streams.length).toBeGreaterThan(0);
});
