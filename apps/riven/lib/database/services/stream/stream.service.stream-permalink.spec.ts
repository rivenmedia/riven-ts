import { MediaEntry } from "@repo/util-plugin-sdk/dto/entities";

import { randomUUID } from "node:crypto";
import { expect } from "vitest";

import { it as baseIt } from "#__tests__/test-context.ts";

const it = baseIt.extend(
  "mediaEntryId",
  async ({ completedMovieContext: { completedMovie } }) => {
    const [mediaEntry] = await completedMovie.getMediaEntries();

    expect.assert(mediaEntry);

    return mediaEntry.id;
  },
);

const permalink = "https://debrid.example.com/permalink/movie.mkv";

it("saves the stream permalink of a media entry", async ({
  em,
  mediaEntryId,
  services: { streamService },
}) => {
  await expect(
    streamService.saveStreamPermalink(mediaEntryId, permalink),
  ).resolves.toMatchObject({ id: mediaEntryId, streamPermalink: permalink });

  await expect(
    em.fork().findOneOrFail(MediaEntry, mediaEntryId),
  ).resolves.toMatchObject({ streamPermalink: permalink });
});

it("clears the stream permalink of a media entry", async ({
  em,
  mediaEntryId,
  services: { streamService },
}) => {
  await streamService.saveStreamPermalink(mediaEntryId, permalink);

  await expect(
    streamService.clearStreamPermalink(mediaEntryId),
  ).resolves.toMatchObject({ id: mediaEntryId, streamPermalink: null });

  await expect(
    em.fork().findOneOrFail(MediaEntry, mediaEntryId),
  ).resolves.toMatchObject({ streamPermalink: null });
});

it("rejects permalink changes for an unknown media entry", async ({
  services: { streamService },
}) => {
  const id = randomUUID();

  await expect(
    streamService.saveStreamPermalink(id, permalink),
  ).rejects.toThrow("MediaEntry not found");
  await expect(streamService.clearStreamPermalink(id)).rejects.toThrow(
    "MediaEntry not found",
  );
});
