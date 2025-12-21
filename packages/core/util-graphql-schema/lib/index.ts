import { ListrrResolver } from "@repo/plugin-listrr/resolver";
// {{resolver-imports}}
import { buildSchema } from "type-graphql";

export const schema = await buildSchema({
  resolvers: [
    ListrrResolver,
    // {{schema-resolvers}}
  ],
  validate: true,
});
