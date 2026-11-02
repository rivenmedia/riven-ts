import z from "zod";

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
  }) as { type?: unknown };

  if (jsonSchema.type === "string") {
    return raw;
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch (error) {
    if (error instanceof SyntaxError) {
      return raw;
    }

    throw error;
  }
}
