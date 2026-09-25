import {
  CoreSettingsResolver,
  RivenSettingsResolver,
} from "@repo/feature-settings/resolver";

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

  return baseBuildSchema({
    ...options,
    resolvers: [
      CoreSettingsResolver,
      RivenSettingsResolver,
      ...(options.resolvers ?? []),
    ],
    scalarsMap: [
      { type: BigInt, scalar: BigIntResolver },
      { type: Object, scalar: JSONObjectResolver },
    ],
    validate: true,
  });
};
