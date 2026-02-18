import { it } from "vitest";

it.todo("combines all item requests from child jobs");

it.todo(
  "deduplicates item requests across child jobs so that the same item is not requested multiple times",
);

it.todo(
  'sends a "riven.item-request.creation.success" event with the created item if the item is successfully processed',
);

it.todo(
  'sends a "riven.media-item.creation.error" event with the item and error message if the item processing fails',
);
