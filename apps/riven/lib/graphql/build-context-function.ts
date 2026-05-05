import {
  type ApolloServerContext,
  CoreKey,
} from "@repo/core-util-graphql-schema";

import { database, services } from "../database/database.ts";
import { sendEvent } from "./send-event.ts";

import type { ContextFunction } from "@apollo/server";
import type { StandaloneServerContextFunctionArgument } from "@apollo/server/standalone";

export const buildContextFunction: () => ContextFunction<
  [StandaloneServerContextFunctionArgument],
  ApolloServerContext
> = () => () =>
  Promise.resolve({
    [CoreKey]: {
      em: database.em.fork(),
      services,
    },
    sendEvent,
    plugins: {},
  });
