import {
  CoreSettingsResolver,
  RivenSettingsResolver,
} from "@repo/feature-settings/resolver";

import { BigIntResolver, JSONObjectResolver } from "graphql-scalars";
import {
  type BuildSchemaOptions,
  buildSchema as baseBuildSchema,
} from "type-graphql";

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
