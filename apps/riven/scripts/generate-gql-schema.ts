import { buildSchema } from "@repo/core-util-graphql-schema";

import { resolvers } from "../lib/graphql/resolvers/index.ts";

await buildSchema({
  resolvers,
  emitSchemaFile: "schema.graphql",
});
