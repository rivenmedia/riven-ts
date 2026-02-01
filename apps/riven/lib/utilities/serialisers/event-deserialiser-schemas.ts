import {
  MediaEntry,
  MediaItem,
} from "@repo/util-plugin-sdk/dto/entities/index";
import { RivenEvent, RivenEventSchemaMap } from "@repo/util-plugin-sdk/events";

import { ZodCodec, ZodCustom, ZodObject, type ZodType, z } from "zod";

import { SerialisedMediaEntry } from "./serialised-media-entry.ts";
import { SerialisedMediaItem } from "./serialised-media-item.ts";

const serialiserMap = new Map<ZodType, ZodCodec>([
  [z.instanceof(MediaItem), SerialisedMediaItem],
  [z.instanceof(MediaEntry), SerialisedMediaEntry],
]);

const shouldSerialise = (a: ZodType, b: ZodType) => {
  if (a instanceof ZodCustom && b instanceof ZodCustom) {
    return a._zod.bag.Class === b._zod.bag.Class;
  }

  return false;
};

function buildDeserialiserSchema(schema: ZodType): ZodObject {
  if (!(schema instanceof ZodObject)) {
    throw new Error("Expected a ZodObject schema");
  }

  const entries = Object.entries(schema.shape) as [
    keyof z.infer<typeof schema>,
    ZodType,
  ][];

  for (const [key, value] of entries) {
    for (const [type, serialiser] of serialiserMap.entries()) {
      if (shouldSerialise(value, type)) {
        schema.shape[key as never] = serialiser;
      }
    }
  }

  return schema;
}

export const eventDeserialiserSchemaMap = new Map<
  RivenEvent["type"],
  ZodObject
>(
  RivenEventSchemaMap.entries().map(([eventType, schema]) => [
    eventType,
    buildDeserialiserSchema(schema),
  ]),
);
