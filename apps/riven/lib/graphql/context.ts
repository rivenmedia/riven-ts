import type { services } from "../database/database.ts";
import type { MainRunnerMachineIntake } from "../state-machines/main-runner/index.ts";
import type { EntityManager } from "@mikro-orm/core";
import type { GraphQLContext } from "@repo/util-plugin-sdk/types/graphql-context";

export const CoreKey = Symbol("Riven Core");

export interface ApolloServerContext extends GraphQLContext {
  [CoreKey]: {
    em: EntityManager;
    services: typeof services;
    sendEvent: MainRunnerMachineIntake;
  };
}
