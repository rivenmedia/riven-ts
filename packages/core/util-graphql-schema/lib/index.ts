import { ListrrResolver } from "@repo/plugin-listrr/resolver";
import { buildSchema } from "type-graphql";

export const schema = await buildSchema({
  resolvers: [ListrrResolver],
  validate: true,
});
