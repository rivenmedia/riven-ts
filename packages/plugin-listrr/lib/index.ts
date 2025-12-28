import {
  ListrrAPI,
  type ListrrContextSlice,
} from "./datasource/listrr.datasource.ts";
import { pluginConfig } from "./listrr-plugin.config.ts";
import { ListrrSettingsResolver } from "./schema/listrr-settings.resolver.ts";
import { ListrrResolver } from "./schema/listrr.resolver.ts";
import { listrrMachine } from "./state-machine/index.ts";
import type { RivenPlugin } from "@repo/util-plugin-sdk";

export default {
  name: pluginConfig.name,
  resolvers: [ListrrResolver, ListrrSettingsResolver],
  stateMachine: listrrMachine,
  context: function (this, { cache }): ListrrContextSlice {
    return {
      api: new ListrrAPI({ cache, token: process.env["LISTRR_API_KEY"] }),
    };
  },
} satisfies RivenPlugin;
