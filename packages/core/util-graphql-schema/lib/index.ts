import { ListrrResolver } from "@repo/listrr-data-access-api/resolver";
import { buildSchema } from "type-graphql";

export const schema = await buildSchema({
  resolvers: [ListrrResolver],
  validate: true,
});
