import type { DataSourceMap } from "../types/utilities.ts";
import type { ApolloClient } from "@apollo/client";
import type { Promisable } from "type-fest";
import { fromPromise } from "xstate";

export interface PluginValidatorInput {
  client: ApolloClient;
  pluginSymbol: symbol;
  dataSources: DataSourceMap;
}

export interface PluginValidatorCallbackParams {
  input: PluginValidatorInput;
}

export type PluginValidatorCallback = (
  params: PluginValidatorCallbackParams,
) => Promisable<boolean>;

export const createPluginValidator = (callback: PluginValidatorCallback) =>
  fromPromise<boolean, PluginValidatorInput>(
    async ({ input }) => await callback({ input }),
  );

export type PluginValidatorLogic = ReturnType<typeof createPluginValidator>;
