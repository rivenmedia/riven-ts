import * as Sentry from "@sentry/node";
import { Type, type } from "arktype";
import { Job } from "bullmq";

import type { MainRunnerMachineIntake } from "../../state-machines/main-runner/index.ts";

type FlowProcessorFunction<
  Input extends object | undefined,
  Output extends object | undefined,
  Children extends object | undefined,
> = (
  job: Job<
    Input extends object ? Type<Input>["infer"] : never,
    Output extends object ? Type<Output>["infer"] : never
  > &
    (Children extends object
      ? { getChildrenValues: () => Promise<Type<Children>["infer"]> }
      : unknown),
  scope: Sentry.Scope,
  token?: string,
) => Promise<Output extends Type ? Output["infer"] : undefined>;

export const createFlowSchema = <
  FlowName extends string,
  Input extends object | undefined = undefined,
  Output extends object | undefined = undefined,
  Children extends object | undefined = undefined,
>(
  flowName: FlowName,
  configuration: Type<{
    input: Input;
    output?: Output;
    children?: Children;
  }>,
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
    configuration.get("output"),
  ) as FlowProcessorFunction<Input, Output, Children>;

  const childrenSchema = configuration.get("children");
  const inputSchema = configuration.get("input");
  const outputSchema = configuration.get("output");

  console.log(childrenSchema);

  return type.raw({
    name: flowName,
    processor,
    ...(childrenSchema ? { children: childrenSchema } : {}),
    ...(inputSchema ? { input: inputSchema } : {}),
    ...(outputSchema ? { output: outputSchema } : {}),
  }) as never;
};
