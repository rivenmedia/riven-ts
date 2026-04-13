import { buildSchema } from "@repo/core-util-graphql-schema";

import { pubSub } from "../lib/graphql/pub-sub.ts";
import { resolvers } from "../lib/graphql/resolvers/index.ts";

await buildSchema({
  resolvers,
  pubSub,
  emitSchemaFile: "schema.graphql",
});
