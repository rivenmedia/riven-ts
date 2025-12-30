import {
  TestAPI,
  type TestContextSlice,
} from "./datasource/test.datasource.ts";
import { pluginConfig } from "./test-plugin.config.ts";
import { TestSettingsResolver } from "./schema/test-settings.resolver.ts";
import { TestResolver } from "./schema/test.resolver.ts";
import type { RivenPlugin } from "@repo/util-plugin-sdk";
import { createMachine } from "xstate";

export default {
  name: pluginConfig.name,
  resolvers: [TestResolver, TestSettingsResolver],
  events: {
    "riven.exited": async () => {
      /* empty */
    },
    "riven.running": async () => {
      /* empty */
    },
  },
  stateMachine: createMachine({}),
  context: function (this, { cache }): TestContextSlice {
    return {
      api: new TestAPI({ cache, token: process.env["TEST_API_KEY"] }),
    };
  },
} satisfies RivenPlugin;
