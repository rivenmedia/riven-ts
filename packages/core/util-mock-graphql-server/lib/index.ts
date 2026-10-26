import { buildSchema } from "@repo/core-util-graphql-schema";

import { ApolloServer } from "@apollo/server";

import type { BaseContext } from "@apollo/server";
import "reflect-metadata";

export const buildMockServer = async <Context extends BaseContext>(
  options: Pick<Parameters<typeof buildSchema>[0], "resolvers" | "pubSub">,
) =>
  new ApolloServer<Context>({
    schema: await buildSchema(options),
  });
