import {
  type ApolloServerContext,
  buildSchema,
} from "@repo/core-util-graphql-schema";

import { ApolloServer } from "@apollo/server";

import "reflect-metadata";

export const buildMockServer = async (
  options: Parameters<typeof buildSchema>[0],
) =>
  new ApolloServer<ApolloServerContext>({
    schema: await buildSchema(options),
  });

export type { ApolloServerContext } from "@repo/core-util-graphql-schema";
