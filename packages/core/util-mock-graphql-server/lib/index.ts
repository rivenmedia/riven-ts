import "reflect-metadata";

import { ApolloServer } from "@apollo/server";
import { schema } from "@repo/core-util-graphql-schema";
import type { Context } from "@repo/core-util-graphql-context";

export const mockServer = new ApolloServer<Context>({
  schema,
});

await mockServer.start();
