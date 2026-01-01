import { PluginDataSource } from "@repo/util-plugin-sdk";

import { Query, Resolver } from "type-graphql";

import { TestAPI } from "../datasource/test.datasource.ts";
import { pluginConfig } from "../test-plugin.config.ts";

@Resolver()
export class TestResolver {
  @Query((_returns) => Boolean)
  async testIsValid(
    @PluginDataSource(pluginConfig.name, TestAPI) api: TestAPI,
  ): Promise<boolean> {
    return await api.validate();
  }
}
