// {{resolver-imports}}
import { ListrrResolver } from "@repo/plugin-listrr/resolver";
import { buildSchema } from "type-graphql";

export const schema = await buildSchema({
  resolvers: [
    // {{schema-resolvers}}
    ListrrResolver,
  ],
  validate: true,
});
