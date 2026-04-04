import { type Type, type } from "arktype";
import assert from "node:assert";

import type { FlowChildJob, FlowJob, ParentOptions } from "bullmq";

type PartialJobOptions = Partial<Omit<FlowJob, "name" | "queueName" | "data">>;

export const createFlowJobBuilder = <
  T extends Type<{
    name: string;
    input?: Type;
  }>,
>(
  schema: T,
) => {
  const inputIsNever =
    schema.get("input") instanceof ZodOptional &&
    schema.shape.input.def.innerType instanceof ZodNever;

  const jobSchema = type({
    queueName: schema.get("name"),
    data: schema.get("input"),
  });

  const queueName = schema.get("name").$.config.name;

  assert(queueName);

  return <O extends PartialJobOptions["opts"]>(
    name: string,
    ...args: T["in"] extends Record<string, never>
      ? [jobOptions?: PartialJobOptions & { opts?: O }]
      : [data: T["in"], jobOptions?: PartialJobOptions & { opts?: O }]
  ): O extends { parent: ParentOptions } ? FlowChildJob : FlowJob => {
    const baseJob = jobSchema.assert({
      queueName,
      ...(inputIsNever ? {} : { data: args[0] }),
    });

    return {
      ...baseJob,
      name,
      ...(args[Number(!inputIsNever)] as object),
    };
  };
};
