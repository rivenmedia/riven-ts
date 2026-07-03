import { LogLevel } from "@repo/feature-settings/enums/log-level.enum";
import {
  MediaItemContentRatingEnum,
  MovieContentRatingEnum,
  ShowContentRatingEnum,
} from "@repo/util-plugin-sdk/dto/enums/content-ratings.enum";
import { ItemRequestState } from "@repo/util-plugin-sdk/dto/enums/item-request-state.enum";
import { ItemRequestType } from "@repo/util-plugin-sdk/dto/enums/item-request-type.enum";
import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";
import { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";
import { ShowStatus } from "@repo/util-plugin-sdk/dto/enums/show-status.enum";

import { registerEnumType } from "type-graphql";

export function registerEnums() {
  registerEnumType(MediaItemState.enum, {
    name: "MediaItemState",
    description: "The state of a media item in the processing pipeline",
  });

  registerEnumType(MediaItemType.enum, {
    name: "MediaItemType",
    description: "The type of a media item",
  });

  registerEnumType(LogLevel, {
    name: "LogLevel",
    description: "The levels of logging severity",
  });

  registerEnumType(MediaItemContentRatingEnum, {
    name: "MediaItemContentRating",
    description:
      "The content rating of a media item. See MovieContentRating and ShowContentRating for more specific ratings.",
  });

  registerEnumType(MovieContentRatingEnum, {
    name: "MovieContentRating",
    description:
      "The content rating of a movie. See https://en.wikipedia.org/wiki/MPAA_film_rating_system for more details.",
  });

  registerEnumType(ShowContentRatingEnum, {
    name: "ShowContentRating",
    description:
      "The content rating of a TV show, based on the TV Parental Guidelines. See https://en.wikipedia.org/wiki/TV_Parental_Guidelines for more details.",
  });

  registerEnumType(ItemRequestState.enum, {
    name: "ItemRequestState",
    description:
      "The state of an item request, either 'requested', 'completed', 'failed', 'ongoing', or 'unreleased'.",
  });

  registerEnumType(ItemRequestType.enum, {
    name: "ItemRequestType",
    description: "The type of a media item request, either 'movie' or 'show'.",
  });

  registerEnumType(ShowStatus.enum, {
    name: "ShowStatus",
    description:
      "The current status of a TV show, either 'continuing', 'upcoming', 'ended', or 'unknown'.",
  });
}
