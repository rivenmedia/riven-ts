import { buildSchema } from "@repo/core-util-graphql-schema";

import { ApolloServer } from "@apollo/server";

import type { BaseContext } from "@apollo/server";
import "reflect-metadata";

export const buildMockServer = async <Context extends BaseContext>(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  resolvers?: readonly Function[],
) =>
  new ApolloServer<Context>({
    schema: await buildSchema({
      resolvers,
    }),
  });
