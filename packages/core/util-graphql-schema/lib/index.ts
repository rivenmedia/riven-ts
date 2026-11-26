import { BigIntResolver, JSONObjectResolver } from "graphql-scalars";
import { buildSchema as baseBuildSchema } from "type-graphql";

import { registerEnums } from "./register-enums.ts";

import type { SetRequired } from "type-fest";
import type { BuildSchemaOptions } from "type-graphql";

export const buildSchema = async (
  options: SetRequired<BuildSchemaOptions, "authChecker">,
) => {
  registerEnums();

  return baseBuildSchema({
    ...options,
    scalarsMap: [
      { type: BigInt, scalar: BigIntResolver },
      { type: Object, scalar: JSONObjectResolver },
    ],
    validate: true,
  });
};
