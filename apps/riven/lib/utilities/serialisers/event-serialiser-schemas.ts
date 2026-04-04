import { RivenEvent, RivenEventSchemaMap } from "@repo/util-plugin-sdk/events";
import { ItemRequestInstance } from "@repo/util-plugin-sdk/schemas/media/item-request";
import { MediaEntryInstance } from "@repo/util-plugin-sdk/schemas/media/media-entry-instance";
import { MediaItemInstance } from "@repo/util-plugin-sdk/schemas/media/media-item-instance";

import { SerialisedFileSystemEntry } from "./serialised-filesystem-entry.ts";
import { SerialisedItemRequest } from "./serialised-item-request.ts";
import { SerialisedMediaItem } from "./serialised-media-item.ts";

import type { Codec } from "./create-codec.ts";
import type { Type } from "arktype";

/**
 * A map of schemas to their corresponding serialiser codec.
 */
const serialiserMap = new Map<Type, Codec<Type, Type>>([
  [MediaItemInstance, SerialisedMediaItem],
  [MediaEntryInstance, SerialisedFileSystemEntry],
  [ItemRequestInstance, SerialisedItemRequest],
]);

/**
 * Augments a {@link RivenEvent} schema with any required serialisers from the {@link serialiserMap serialiser map}.
 *
 * @param schema The base schema, typically a {@link RivenEvent} schema
 *
 * @returns The augmented base schema with any required serialisers attached
 */
function buildSerialiserSchema(schema: Type): Type {
  for (const [key, value] of Object.entries<Type>(schema.shape)) {
    schema.shape[key as never] = serialiserMap.get(value) ?? value;
  }

  return schema;
}

/**
 * A map of {@link RivenEvent} types to their serialiser schemas.
 */
export const eventSerialiserSchemaMap = new Map<
  RivenEvent["type"],
  Type<{ type: RivenEvent["type"] }>
>(
  RivenEventSchemaMap.entries().map(([eventType, schema]) => [
    eventType,
    buildSerialiserSchema(schema),
  ]),
);
