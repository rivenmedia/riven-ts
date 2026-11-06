import z from "zod";

import type { JSONSchema } from "zod/v4/core";

/**
 * True when the schema only accepts strings (ignoring `null`), so the raw
 * environment value must be used as-is rather than JSON-parsed.
 */
function isStringTyped(node: JSONSchema.JSONSchema): boolean {
  if (node.type === "string") {
    return true;
  }

  if (Array.isArray(node.type)) {
    const types = node.type.filter((type) => type !== "null");

    return types.length > 0 && types.every((type) => type === "string");
  }

  if (node.anyOf) {
    const members = node.anyOf.filter((member) => member.type !== "null");

    return members.length > 0 && members.every(isStringTyped);
  }

  return false;
}

/**
 * Decodes a raw environment string into the representation the field schema expects.
 *
 * String-typed fields are returned as-is; everything else is parsed as JSON.
 * Unparseable values are returned raw so Zod can report a proper validation error.
 */
export function decodeEnvValue(raw: string, fieldSchema: z.ZodType): unknown {
  const jsonSchema = z.toJSONSchema(fieldSchema, {
    io: "input",
    unrepresentable: "any",
  });

  if (isStringTyped(jsonSchema)) {
    return raw;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return raw;
    }

    throw error;
  }
}
