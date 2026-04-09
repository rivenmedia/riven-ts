import { database } from "../database/database.ts";

import type { ContextFunction } from "@apollo/server";
import type { StandaloneServerContextFunctionArgument } from "@apollo/server/standalone";
import type { ApolloServerContext } from "@repo/core-util-graphql-schema";

export const buildContextFunction: () => ContextFunction<
  [StandaloneServerContextFunctionArgument],
  ApolloServerContext
> = () => () =>
  Promise.resolve({
    em: database.em.fork(),
  });
