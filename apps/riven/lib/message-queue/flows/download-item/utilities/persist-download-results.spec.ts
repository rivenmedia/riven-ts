import { it } from "vitest";

it.todo("throws an error if the media item has no streams");

it.todo(
  'throws a MediaItemDownloadErrorIncorrectState if the media item is not in the "scraped" state',
);

it.todo('sets the active stream and updates the state to "downloaded"');

it.todo("adds a single media entry for movies");

it.todo("adds one media entry per episode for shows");

it.todo("throws an error if a validation error occurs during persistence");
