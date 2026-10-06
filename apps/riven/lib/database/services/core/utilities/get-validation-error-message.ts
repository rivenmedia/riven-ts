import { ValidationError } from "class-validator";
import z from "zod";

/**
 * Converts an error thrown during entity persistence (either a standard `Error`,
 * or the array of `ValidationError`s thrown by `validateOrReject`) into a single message.
 */
export function getValidationErrorMessage(error: unknown) {
  return z
    .union([z.instanceof(Error), z.array(z.instanceof(ValidationError))])
    .transform((rawError) => {
      if (Array.isArray(rawError)) {
        return rawError
          .map((err) =>
            err.constraints ? Object.values(err.constraints).join("; ") : "",
          )
          .join("; ");
      }

      return rawError.message;
    })
    .parse(error);
}
