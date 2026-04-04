import * as Sentry from "@sentry/node";
import { type Type, type } from "arktype";
import { Job } from "bullmq";

type SandboxedProcessorFunction<
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

export const createSandboxedJobSchema = <
  SandboxedJobName extends string,
  Input extends Type | undefined = undefined,
  Output extends Type | undefined = undefined,
  Children extends Type | undefined = undefined,
>(
  jobName: SandboxedJobName,
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
    name: SandboxedJobName;
    processor: SandboxedProcessorFunction<Input, Output, Children>;
  } & ((Input extends Type ? { input: Input["infer"] } : unknown) &
    (Children extends Type ? { children: Children["infer"] } : unknown) &
    (Output extends Type ? { output: Output["infer"] } : unknown))
> => {
  const processor = type.fn.raw(
    type({
      job: type.instanceOf(Job),
      scope: type.instanceOf(Sentry.Scope),
    }),
    ":",
    outputSchema ?? type("never"),
  ) as SandboxedProcessorFunction<Input, Output, Children>;

  return type.raw({
    name: jobName,
    processor,
    ...(childrenSchema ? { children: childrenSchema } : {}),
    ...(inputSchema ? { input: inputSchema } : {}),
    ...(outputSchema ? { output: outputSchema } : {}),
  }) as never;
};
