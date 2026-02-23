import { ChangeSetType } from "@mikro-orm/core";
import { it } from "vitest";

it.todo("does not compute changesets for entities that are not media items");

it.todo(
  `does not compute changesets if the changeset type is not "${ChangeSetType.UPDATE}"`,
);

it.todo(
  "does not compute changesets if the media item state is not being updated",
);

it.todo(
  "does not compute changesets if the media item state is being updated to a non-propagable state",
);

it.todo(
  "propagates the state to seasons and episodes if the media item is a show",
);

it.todo("propagates the state to episodes if the media item is a season");
