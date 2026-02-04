import { buildSchema } from "@repo/core-util-graphql-schema";

import { ApolloServer } from "@apollo/server";

import "reflect-metadata";

export const mockServer = new ApolloServer({
  schema: await buildSchema([]),
});
