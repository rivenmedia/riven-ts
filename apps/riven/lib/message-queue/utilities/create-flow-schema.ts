import * as Sentry from "@sentry/node";
import { type Type, type } from "arktype";
import { Job } from "bullmq";

import type { MainRunnerMachineIntake } from "../../state-machines/main-runner/index.ts";

type FlowProcessorFunction<
  Input extends Type | undefined,
  Output extends Type | undefined,
  Children extends Type | undefined,
> = (
  job: Job<
    Input extends Type ? Input["infer"] : never,
    Output extends Type ? Output["infer"] : never
  > &
    (Children extends Type
      ? { getChildrenValues: () => Promise<Children["infer"]> }
      : unknown),
  scope: Sentry.Scope,
  token?: string,
) => Promise<Output extends Type ? Output["infer"] : undefined>;

export const createFlowSchema = <
  FlowName extends string,
  Input extends Type | undefined = undefined,
  Output extends Type | undefined = undefined,
  Children extends Type | undefined = undefined,
>(
  flowName: FlowName,
  {
    input: inputSchema,
    output: outputSchema,
    children: childrenSchema,
  }: {
    input?: Input;
    output?: Output;
    children?: Children;
  },
): Type<
  {
    name: FlowName;
    processor: FlowProcessorFunction<Input, Output, Children>;
  } & ((Input extends Type ? { input: Input["infer"] } : unknown) &
    (Children extends Type ? { children: Children["infer"] } : unknown) &
    (Output extends Type ? { output: Output["infer"] } : unknown))
> => {
  const processor = type.fn.raw(
    type({
      job: type.instanceOf(Job),
      scope: type.instanceOf(Sentry.Scope),
      "token?": "string",
    }),
    type.declare<MainRunnerMachineIntake>(),
    ":",
    outputSchema ?? type("never"),
  ) as FlowProcessorFunction<Input, Output, Children>;

  return type.raw({
    name: flowName,
    processor,
    ...(childrenSchema ? { children: childrenSchema } : {}),
    ...(inputSchema ? { input: inputSchema } : {}),
    ...(outputSchema ? { output: outputSchema } : {}),
  }) as never;
};
