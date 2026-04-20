import * as Sentry from "@sentry/node";
import z, {
  type ZodNever,
  type ZodObject,
  type ZodOptional,
  type ZodType,
} from "zod";

import type { Services } from "../../database/database.ts";
import type { MainRunnerMachineIntake } from "../../state-machines/main-runner/index.ts";
import type { ValidPlugin } from "../../types/plugins.ts";
import type { Job } from "bullmq";

export const createFlowSchema = <
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
              Job<z.infer<typeof inputSchema>, z.infer<typeof outputSchema>>,
              "getChildrenValues"
            > & {
              getChildrenValues: () => Promise<
                z.infer<typeof childrenValuesSchema>
              >;
            }
          >(),
          scope: z.custom<Sentry.Scope>(),
          token: z.string().optional(),
        }),
        z.object({
          services: z.custom<Services["services"]>(),
          sendEvent: z.custom<MainRunnerMachineIntake>(),
          plugins: z.map(z.symbol(), z.custom<ValidPlugin>()),
        }),
      ],
      output: z.promise(outputSchema),
    }),
  });
};
