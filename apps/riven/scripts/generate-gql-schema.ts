import { buildSchema } from "@repo/core-util-graphql-schema";
import { plugin as tmdbPlugin } from "@repo/plugin-tmdb";
import { plugin as tvdb } from "@repo/plugin-tvdb";

import { authChecker } from "#graphql/auth/auth-checker.ts";
import { pubSub } from "#graphql/pubsub.ts";
import { resolvers } from "#graphql/resolvers/index.ts";

await buildSchema({
  resolvers: [...resolvers, ...tmdbPlugin.resolvers, ...tvdb.resolvers],
  pubSub,
  authChecker,
  emitSchemaFile: "schema.graphql",
});
