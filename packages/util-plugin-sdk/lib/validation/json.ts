import z from "zod";

/**
 * Encodes/decodes between a JSON string and a JSON object.
 *
 * @param schema The Zod schema to validate the JSON object against.
 */
export const json = <T extends z.core.$ZodType>(schema: T) =>
  z.codec(z.string(), schema, {
    decode: (jsonString, ctx) => {
      try {
        return JSON.parse(jsonString) as z.input<T>;
      } catch (err: unknown) {
        if (err instanceof Error) {
          ctx.issues.push({
            code: "invalid_format",
            format: "json",
            input: jsonString,
            message: err.message,
          });
        }

        return z.NEVER;
      }
    },
    encode: (value) => JSON.stringify(value),
  });
