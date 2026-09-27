import { buildSchema } from "@repo/core-util-graphql-schema";
import { plugin as tmdbPlugin } from "@repo/plugin-tmdb";
import { plugin as tvdb } from "@repo/plugin-tvdb";

import { resolvers } from "../lib/graphql/resolvers/index.ts";

await buildSchema({
  resolvers: [...resolvers, ...tmdbPlugin.resolvers, ...tvdb.resolvers],
  emitSchemaFile: "schema.graphql",
});
