import { RivenEvent, RivenEventSchemaMap } from "@repo/util-plugin-sdk/events";
import { MediaEntry } from "@repo/util-plugin-sdk/schemas/media/media-entry";
import { MediaItem } from "@repo/util-plugin-sdk/schemas/media/media-item";
import { ItemRequest } from "@repo/util-plugin-sdk/schemas/media/requested-item";

import { SerialisedFileSystemEntry } from "./serialised-filesystem-entry.ts";
import { SerialisedItemRequest } from "./serialised-item-request.ts";
import { SerialisedMediaItem } from "./serialised-media-item.ts";

import type { ZodCodec, ZodObject, ZodType } from "zod";

/**
 * A map of schemas to their corresponding serialiser codec.
 */
const serialiserMap = new Map<ZodType, ZodCodec>([
  [MediaItem, SerialisedMediaItem],
  [MediaEntry, SerialisedFileSystemEntry],
  [ItemRequest, SerialisedItemRequest],
]);

/**
 * Augments a {@link RivenEvent} schema with any required serialisers from the {@link serialiserMap serialiser map}.
 *
 * @param schema The base schema, typically a {@link RivenEvent} schema
 *
 * @returns The augmented base schema with any required serialisers attached
 */
function buildSerialiserSchema(schema: ZodObject): ZodObject {
  for (const [key, value] of Object.entries<ZodType>(schema.shape)) {
    schema.shape[key as never] = serialiserMap.get(value) ?? value;
  }

  return schema;
}

/**
 * A map of {@link RivenEvent} types to their serialiser schemas.
 */
export const eventSerialiserSchemaMap = new Map<RivenEvent["type"], ZodObject>(
  RivenEventSchemaMap.entries().map(([eventType, schema]) => [
    eventType,
    buildSerialiserSchema(schema),
  ]),
);
