import z, { type ZodType } from "zod";

import type { MainRunnerMachineIntake } from "../../state-machines/main-runner/index.ts";
import type { Job } from "bullmq";

export const createFlowSchema = <
  Type extends string,
  Children extends ZodType,
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  Output extends Record<string, ZodType> = {},
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  Payload extends Record<string, ZodType> = {},
>(
  type: Type,
  childrenSchema: Children,
  outputSchema: z.ZodObject<Output> = z.object<Output>(),
  _inputSchema: z.ZodObject<Payload> = z.object<Payload>(),
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
    children: childrenValuesSchema,
    processor: z.function({
      input: [
        z.custom<MainRunnerMachineIntake>(),
        z.custom<
          Omit<
            Job<
              z.infer<typeof _inputSchema>,
              z.infer<typeof wrappedOutputSchema>
            >,
            "getChildrenValues"
          > & {
            getChildrenValues: () => Promise<
              z.infer<typeof childrenValuesSchema>
            >;
          }
        >(),
        z.string().optional(),
        z.custom<AbortSignal>().optional(),
      ],
      output: z.promise(wrappedOutputSchema),
    }),
  });
};
