import * as pluginListrr from "@repo/plugin-listrr";
// {{resolver-imports}}
import { buildSchema } from "type-graphql";

export const schema = await buildSchema({
  resolvers: [
    ...pluginListrr.resolvers,
    // {{schema-resolvers}}
  ],
  validate: true,
});
