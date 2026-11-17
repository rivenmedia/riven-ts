import { RequestContext } from "@mikro-orm/core";

import { database, services } from "#database/database.ts";
import { logger } from "#utilities/logger/logger.ts";

import { CoreKey } from "./context.ts";

import type { RankingManager } from "#ranking/ranking-manager.ts";
import type { SettingsManager } from "#settings/settings-manager.ts";
import type { MainRunnerMachineIntake } from "#state-machines/main-runner/index.ts";
import type { ValidPluginMap } from "#types/plugins.ts";
import type { ApolloServerContext } from "./context.ts";
import type { ContextFunction } from "@apollo/server";
import type { ExpressContextFunctionArgument } from "@as-integrations/express5";
import type { GraphQLContext } from "@repo/util-plugin-sdk/types/graphql-context";

export const buildContextFunction: (
  sendEvent: MainRunnerMachineIntake,
  sendExternalEvent: GraphQLContext["sendEvent"],
  validPlugins: ValidPluginMap,
  settingsManager: SettingsManager,
  rankingManager: RankingManager,
) => ContextFunction<[ExpressContextFunctionArgument], ApolloServerContext> =
  (
    sendEvent,
    sendExternalEvent,
    validPlugins,
    settingsManager,
    rankingManager,
  ) =>
  async () =>
    Promise.resolve({
      [CoreKey]: {
        em: RequestContext.getEntityManager() ?? database.em.fork(),
        services,
        sendEvent,
        settingsManager,
        rankingManager,
      },
      logger,
      sendEvent: sendExternalEvent,
      plugins: validPlugins,
    });
