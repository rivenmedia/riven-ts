import * as Sentry from "@sentry/node";
import { type Type, type } from "arktype";

import type { MainRunnerMachineIntake } from "../../state-machines/main-runner/index.ts";
import type { Job } from "bullmq";

export const createFlowSchema = <
  FlowName extends string,
  Children extends Record<string, unknown>,
  Output extends Type,
  Payload extends Record<string, unknown> = Record<string, unknown>,
>(
  flowName: FlowName,
  {
    children: childrenSchema,
    input: inputSchema,
    output: outputSchema,
  }: {
    children?: Children;
    input?: Type<Payload>;
    output?: Output;
  },
) => {
  const processor = type.fn(
    type({
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
      scope: type.instanceOf(Sentry.Scope),
      "token?": "string",
    }),
    type.declare<MainRunnerMachineIntake>(),
    ":",
    outputSchema,
  );

  return type.raw({
    name: flowName,
    input: inputSchema,
    children: childrenSchema,
    output: outputSchema,
    processor,
  });
};
