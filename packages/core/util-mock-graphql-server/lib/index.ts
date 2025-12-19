import { ApolloServer } from "@apollo/server";

export async function buildMockServer() {
  const { schema } = await import("@repo/core-util-graphql-schema");

  return new ApolloServer({
    schema,
  });
}
