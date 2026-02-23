import assert from "node:assert";
import z, {
  type ZodLiteral,
  ZodNever,
  type ZodObject,
  ZodOptional,
  type ZodType,
} from "zod";

import type { FlowChildJob, FlowJob, ParentOptions } from "bullmq";

type PartialJobOptions = Partial<Omit<FlowJob, "name" | "queueName" | "data">>;

export const createFlowJobBuilder = <
  T extends ZodObject<{
    name: ZodLiteral<string>;
    input?: ZodType;
  }>,
>(
  schema: T,
) => {
  const inputIsNever =
    schema.shape.input instanceof ZodOptional &&
    schema.shape.input.def.innerType instanceof ZodNever;

  const jobSchema = z.object({
    queueName: schema.shape.name,
    data: schema.shape.input,
  });

  const [queueName] = schema.shape.name.def.values;

  assert(queueName, `No event type found for flow: ${schema.shape.name.value}`);

  return <O extends PartialJobOptions["opts"]>(
    name: string,
    ...args: z.infer<T>["input"] extends Record<string, never>
      ? [jobOptions?: PartialJobOptions & { opts?: O }]
      : [
          data: z.infer<T>["input"],
          jobOptions?: PartialJobOptions & { opts?: O },
        ]
  ): O extends { parent: ParentOptions } ? FlowChildJob : FlowJob => {
    const baseJob = jobSchema.parse({
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
