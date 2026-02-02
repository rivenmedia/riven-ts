import { RivenEvent, RivenEventSchemaMap } from "@repo/util-plugin-sdk/events";
import { MediaEntry } from "@repo/util-plugin-sdk/schemas/media/media-entry";
import { MediaItem } from "@repo/util-plugin-sdk/schemas/media/media-item";

import { type ZodCodec, type ZodObject, type ZodType, z } from "zod";

import { SerialisedFileSystemEntry } from "./serialised-filesystem-entry.ts";
import { SerialisedMediaItem } from "./serialised-media-item.ts";

/**
 * A map of schemas to their corresponding serialiser codec.
 */
const serialiserMap = new Map<ZodType, ZodCodec>([
  [MediaItem, SerialisedMediaItem],
  [MediaEntry, SerialisedFileSystemEntry],
]);

/**
 * Augments a {@link RivenEvent} schema with any required serialisers from the {@link serialiserMap serialiser map}.
 *
 * @param schema The base schema, typically a {@link RivenEvent} schema
 *
 * @returns The augmented base schema with any required serialisers attached
 */
function buildSerialiserSchema(schema: ZodObject): ZodObject {
  const schemaShapeEntries = Object.entries(schema.shape) as [
    keyof z.infer<typeof schema>,
    ZodType,
  ][];

  for (const [key, value] of schemaShapeEntries) {
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
