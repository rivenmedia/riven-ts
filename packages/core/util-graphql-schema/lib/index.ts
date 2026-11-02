import { BigIntResolver, JSONObjectResolver } from "graphql-scalars";
import { buildSchema as baseBuildSchema } from "type-graphql";

import { registerEnums } from "./register-enums.ts";

import type { BuildSchemaOptions } from "type-graphql";

export const buildSchema = async (
  options: Omit<BuildSchemaOptions, "resolvers"> & {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    resolvers?: readonly Function[] | undefined;
  },
) => {
  registerEnums();

  const [firstResolver, ...otherResolvers] = options.resolvers ?? [];

  if (!firstResolver) {
    throw new Error("At least one resolver is required to build the schema.");
  }

  return baseBuildSchema({
    ...options,
    resolvers: [firstResolver, ...otherResolvers],
    scalarsMap: [
      { type: BigInt, scalar: BigIntResolver },
      { type: Object, scalar: JSONObjectResolver },
    ],
    validate: true,
  });
};
