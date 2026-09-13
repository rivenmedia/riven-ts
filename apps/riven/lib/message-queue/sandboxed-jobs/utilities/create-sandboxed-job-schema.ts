import { ApolloClient } from "@apollo/client";
import z from "zod";

import type { Scope } from "@sentry/node";
import type { SandboxedJob } from "bullmq";
import type { ZodNever, ZodObject, ZodOptional, ZodType } from "zod";

export const createSandboxedJobSchema = <
  Type extends string,
  Children extends ZodType,
  Output extends ZodType = ZodOptional<ZodNever>,
  Payload extends Record<string, ZodType> = Record<string, ZodNever>,
>(
  type: Type,
  {
    children: childrenSchema = z.never().optional() as never,
    input: inputSchema = z.never().optional() as never,
    output: outputSchema = z.never().optional() as never,
  }: {
    children?: Children;
    input?: ZodObject<Payload>;
    output?: Output;
  },
) => {
  const childrenValuesSchema = z.record(z.string(), childrenSchema);

  return z.object({
    name: z.literal(type),
    input: inputSchema,
    children: childrenValuesSchema,
    output: outputSchema,
    processor: z.function({
      input: [
        z.object({
          job: z.custom<
            Omit<
              SandboxedJob<
                z.infer<typeof inputSchema>,
                z.infer<typeof outputSchema>
              >,
              "getChildrenValues"
            > & {
              getChildrenValues: () => Promise<
                z.infer<typeof childrenValuesSchema>
              >;
            }
          >(),
          scope: z.custom<Scope>(),
          client: z.instanceof(ApolloClient),
        }),
      ],
      output: z.promise(outputSchema),
    }),
  });
};
