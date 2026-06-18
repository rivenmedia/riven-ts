import z from "zod";

/**
 * Encodes/decodes between a JSON string and a JSON object.
 *
 * @param schema The Zod schema to validate the JSON object against.
 */
export const json = <T extends z.core.$ZodType>(schema: T) =>
  z.codec(z.json(), schema, {
    decode: (jsonString, ctx) => {
      try {
        if (typeof jsonString !== "string") {
          return JSON.parse(JSON.stringify(jsonString)) as z.input<T>;
        }

        return JSON.parse(jsonString) as z.input<T>;
      } catch (err: unknown) {
        if (err instanceof Error) {
          ctx.issues.push({
            code: "invalid_format",
            format: "json",
            input: JSON.stringify(jsonString),
            message: "Invalid JSON: " + err.message,
          });
        }

        return z.NEVER;
      }
    },
    encode: (value) =>
      typeof value === "string" ? value : JSON.stringify(value),
  });
