import z from "zod";

import type { ZodType } from "zod";

export function createProgramEventErrorSchema<
  Type extends string,
  ErrorType extends string | undefined = undefined,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  Payload extends Record<string, ZodType> = {},
>(
  params: Type | [Type, ErrorType?],
  payloadSchema: z.ZodObject<Payload> = z.object<Payload>(),
) {
  const [type, errorType] = Array.isArray(params)
    ? params
    : [params, undefined];

  type ErrorSuffix = ErrorType extends "" | undefined ? "" : `.${ErrorType}`;

  const errorSuffix = (errorType ? `.${errorType}` : "") as ErrorSuffix;

  return z.object({
    ...payloadSchema.shape,
    type: z.literal(`riven.${type}.error${errorSuffix}`),
  });
}
