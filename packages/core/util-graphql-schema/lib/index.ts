import { BigIntResolver } from "graphql-scalars";
import {
  type BuildSchemaOptions,
  type NonEmptyArray,
  buildSchema as baseBuildSchema,
} from "type-graphql";

export const buildSchema = async (
  options: Omit<BuildSchemaOptions, "resolvers"> & {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    resolvers: NonEmptyArray<Function>;
  },
) =>
  baseBuildSchema({
    ...options,
    scalarsMap: [{ type: BigInt, scalar: BigIntResolver }],
    validate: true,
  });
