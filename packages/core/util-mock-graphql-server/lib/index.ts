import { buildSchema } from "@repo/core-util-graphql-schema";

import { ApolloServer } from "@apollo/server";

import type { BaseContext } from "@apollo/server";
import type { ContainerType } from "type-graphql";
import "reflect-metadata";

export interface BuildMockServerOptions {
  /**
   * Resolves resolver instances. Required when the resolvers under test take
   * their dependencies through a DI container rather than the GraphQL context.
   */
  container?: ContainerType;
}

export const buildMockServer = async <Context extends BaseContext>(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  resolvers?: readonly Function[],
  { container }: BuildMockServerOptions = {},
) =>
  new ApolloServer<Context>({
    schema: await buildSchema({
      resolvers,
      ...(container && { container }),
    }),
  });
