import "reflect-metadata";

import { ApolloServer } from "@apollo/server";
import { schema } from "@repo/core-util-graphql-schema";

export const mockServer = new ApolloServer({
  schema,
});
