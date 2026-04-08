import {
  type ApolloServerContext,
  buildSchema,
} from "@repo/core-util-graphql-schema";

import { ApolloServer } from "@apollo/server";

import "reflect-metadata";

export const buildMockServer = async (
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  resolvers?: readonly Function[],
) =>
  new ApolloServer<ApolloServerContext>({
    schema: await buildSchema({
      resolvers,
    }),
  });

export type { ApolloServerContext } from "@repo/core-util-graphql-schema";
