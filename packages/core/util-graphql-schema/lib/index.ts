import { BigIntResolver, JSONObjectResolver } from "graphql-scalars";
import { buildSchema as baseBuildSchema } from "type-graphql";

import { LogLevelAnchor } from "./log-level-anchor.type.ts";
import { registerEnums } from "./register-enums.ts";

import type { SetOptional } from "type-fest";
import type { BuildSchemaOptions } from "type-graphql";

export const buildSchema = async (
  options: SetOptional<BuildSchemaOptions, "resolvers">,
) => {
  registerEnums();

  const [firstResolver, ...otherResolvers] = options.resolvers ?? [];

  if (!firstResolver) {
    throw new Error("At least one resolver is required to build the schema.");
  }

  return baseBuildSchema({
    ...options,
    resolvers: [firstResolver, ...otherResolvers],
    orphanedTypes: [...(options.orphanedTypes ?? []), LogLevelAnchor],
    scalarsMap: [
      { type: BigInt, scalar: BigIntResolver },
      { type: Object, scalar: JSONObjectResolver },
    ],
    validate: true,
  });
};
