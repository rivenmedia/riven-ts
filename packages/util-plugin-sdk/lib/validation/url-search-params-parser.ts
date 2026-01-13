import z from "zod";

/**
 * Encodes/decodes between a URLSearchParams string and a URLSearchParams instance.
 */
export const urlSearchParamsCodec = z.codec(
  z.string(),
  z.instanceof(URLSearchParams),
  {
    decode: (jsonString, ctx) => {
      try {
        return new URLSearchParams(jsonString);
      } catch (err: unknown) {
        if (err instanceof Error) {
          ctx.issues.push({
            code: "invalid_format",
            format: "json",
            input: JSON.stringify(jsonString),
            message: err.message,
          });
        }

        return z.NEVER;
      }
    },
    encode: (value) => value.toString(),
  },
);
