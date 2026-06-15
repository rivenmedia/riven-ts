import type { services } from "../database/database.ts";
import type { EntityManager } from "@mikro-orm/core";
import type { GraphQLContext } from "@repo/util-plugin-sdk/types/graphql-context";
import type { Logger } from "winston";

export const CoreKey = Symbol("Riven Core");

export interface ApolloServerContext extends GraphQLContext {
  [CoreKey]: {
    em: EntityManager;
    services: typeof services;
  };
  logger: Logger;
}
