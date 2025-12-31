import { TestAPI } from "../datasource/test.datasource.ts";
import { pluginConfig } from "../test-plugin.config.ts";
import { Query, Resolver } from "type-graphql";
import { PluginDataSource } from "@repo/util-plugin-sdk";

@Resolver()
export class TestResolver {
  @Query((_returns) => Boolean)
  async testIsValid(
    @PluginDataSource(pluginConfig.name, TestAPI) api: TestAPI,
  ): Promise<boolean> {
    return await api.validate();
  }
}
