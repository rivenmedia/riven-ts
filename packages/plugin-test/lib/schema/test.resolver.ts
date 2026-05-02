import { PluginDataSource } from "@rivenmedia/plugin-sdk";

import { Query, Resolver } from "type-graphql";

import { TestAPI } from "../datasource/test.datasource.ts";
import { pluginConfig } from "../test-plugin.config.ts";

@Resolver()
export class TestResolver {
  @Query(() => Boolean)
  testIsValid(
    @PluginDataSource(pluginConfig.name, TestAPI) api: TestAPI,
  ): Promise<boolean> {
    return api.validate();
  }
}
