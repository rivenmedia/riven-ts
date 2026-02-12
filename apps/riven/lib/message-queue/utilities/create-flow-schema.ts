import z, { type ZodNever, type ZodOptional, type ZodType } from "zod";

import type { MainRunnerMachineIntake } from "../../state-machines/main-runner/index.ts";
import type { Job } from "bullmq";

export const createFlowSchema = <
  Type extends string,
  Children extends ZodType,
  Output extends ZodType = ZodOptional<ZodNever>,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  Payload extends Record<string, ZodType> = {},
>(
  type: Type,
  childrenSchema: Children,
  outputSchema: Output = z.never().optional() as never,
  inputSchema: z.ZodObject<Payload> = z.object<Payload>(),
) => {
  const wrappedOutputSchema = z.union([
    z.object({
      success: z.literal(true),
      result: outputSchema,
    }),
    z.object({
      success: z.literal(false),
      error: z.unknown(),
    }),
  ]);

  const childrenValuesSchema = z.record(z.string(), childrenSchema);

  return z.object({
    name: z.literal(type),
    input: inputSchema,
    children: childrenValuesSchema,
    output: wrappedOutputSchema,
    processor: z.function({
      input: [
        z.custom<
          Omit<
            Job<
              z.infer<typeof inputSchema>,
              z.infer<typeof wrappedOutputSchema>
            >,
            "getChildrenValues"
          > & {
            getChildrenValues: () => Promise<
              z.infer<typeof childrenValuesSchema>
            >;
          }
        >(),
        z.custom<MainRunnerMachineIntake>(),
      ],
      output: z.promise(wrappedOutputSchema),
    }),
  });
};
