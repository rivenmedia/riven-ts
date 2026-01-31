import {
  type ParsedPlugins,
  parsePluginsFromDependencies,
} from "@repo/util-plugin-sdk";

import "reflect-metadata";

import { fromPromise } from "xstate";

import packageJson from "../../../../package.json" with { type: "json" };

export const collectPluginsForRegistration = fromPromise<ParsedPlugins>(
  async () => {
    return await parsePluginsFromDependencies(
      packageJson.dependencies,
      import.meta.resolve.bind(null),
    );
  },
);
