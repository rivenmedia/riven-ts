import { LogLevel } from "@repo/feature-settings/enums/log-level.enum";
import {
  CoreSettingsResolver,
  RivenSettingsResolver,
} from "@repo/feature-settings/resolver";

import { BigIntResolver, JSONObjectResolver } from "graphql-scalars";
import { buildSchema as baseBuildSchema, registerEnumType } from "type-graphql";

import type { BuildSchemaOptions } from "type-graphql";

registerEnumType(LogLevel, {
  name: "LogLevel",
});

export const buildSchema = async (
  options: Omit<BuildSchemaOptions, "resolvers"> & {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    resolvers?: readonly Function[] | undefined;
  },
) =>
  baseBuildSchema({
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
