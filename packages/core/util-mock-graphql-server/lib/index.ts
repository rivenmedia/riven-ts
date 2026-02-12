import { buildSchema } from "@repo/core-util-graphql-schema";

import { ApolloServer } from "@apollo/server";

import "reflect-metadata";

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export const buildMockServer = async (resolvers: Function[] = []) =>
  new ApolloServer({
    schema: await buildSchema(resolvers),
  });
