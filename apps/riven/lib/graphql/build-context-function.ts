import {
  AdminKey,
  type AdminPluginRecord,
  type ApolloServerContext,
  CoreKey,
} from "@repo/core-util-graphql-schema";

import { database } from "../database/database.ts";
import { logger } from "../utilities/logger/logger.ts";

import type { mainRunnerMachine } from "../state-machines/main-runner/index.ts";
import type { ContextFunction } from "@apollo/server";
import type { StandaloneServerContextFunctionArgument } from "@apollo/server/standalone";
import type { GraphQLContext } from "@repo/util-plugin-sdk/types/graphql-context";
import type { Queue } from "bullmq";
import type { ActorRefFromLogic } from "xstate";

export interface BuildContextFunctionDependencies {
  sendEvent: GraphQLContext["sendEvent"];
  /**
   * The broadest plugin map the bootstrap layer has at GQL start time
   * (after validation this is the `ValidPluginMap` — the pending /
   * invalid entries are surfaced separately via the registrar's
   * output and are not part of this slot today). The structural
   * {@link AdminPluginRecord} type accepted here is a superset, so
   * the resolver layer can be extended later to include
   * pending / invalid plugins without changing this signature.
   */
  plugins: AdminPluginRecord;
  /**
   * Live reference to the main-runner actor. Used per request to read
   * the latest queue snapshot so the admin queue map reflects the
   * current state (queues are created lazily inside the `START`
   * event handler of `mainRunnerMachine`).
   */
  mainRunnerRef: ActorRefFromLogic<typeof mainRunnerMachine>;
}

/**
 * Build the per-request Apollo context. Returned function is invoked
 * by Apollo on every incoming operation, so it's the right place to
 * read live actor state (`mainRunnerRef.getSnapshot()`).
 *
 * Queue map keys:
 *   - Flow queues: bare flow name (e.g. `"process-media-item"`)
 *   - Sandboxed queues: bare job name (e.g. `"download-item.map-items-to-files"`)
 *   - Plugin queues: `"plugin:<pluginSymbolDescription>:<eventType>"`
 *
 * If the main-runner hasn't reached `Running` yet (i.e. no `START`
 * event processed), `flowWorkers` / `sandboxedWorkers` are `undefined`
 * and the queue map will contain only any plugin queues that are
 * already registered. This is intentional — admin resolvers should
 * tolerate an empty / partial map rather than blocking the request.
 */
export const buildContextFunction: (
  deps: BuildContextFunctionDependencies,
) => ContextFunction<
  [StandaloneServerContextFunctionArgument],
  ApolloServerContext
> =
  ({ sendEvent, plugins, mainRunnerRef }) =>
  () => {
    const { flowWorkers, sandboxedWorkers, pluginQueues } =
      mainRunnerRef.getSnapshot().context;

    const queues = new Map<string, Queue>();

    if (flowWorkers) {
      for (const [name, { queue }] of Object.entries(flowWorkers)) {
        queues.set(name, queue);
      }
    }

    if (sandboxedWorkers) {
      for (const [name, { queue }] of Object.entries(sandboxedWorkers)) {
        queues.set(name, queue);
      }
    }

    for (const [pluginSymbol, eventMap] of pluginQueues) {
      const pluginName = pluginSymbol.description ?? "unknown";

      for (const [eventType, queue] of eventMap) {
        queues.set(`plugin:${pluginName}:${eventType}`, queue);
      }
    }

    return Promise.resolve({
      [CoreKey]: {
        em: database.em.fork(),
      },
      [AdminKey]: {
        plugins,
        queues,
      },
      logger,
      sendEvent,
      plugins: {},
    });
  };
