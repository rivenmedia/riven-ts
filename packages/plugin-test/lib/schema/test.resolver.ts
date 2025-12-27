import type { TestContextSlice } from "../datasource/test.datasource.ts";
import { pluginConfig } from "../test-plugin.config.ts";
import { Query, Resolver } from "type-graphql";
import { PluginContext } from "@repo/util-plugin-sdk";

@Resolver()
export class TestResolver {
  @Query((_returns) => Boolean)
  async testIsValid(
    @PluginContext(pluginConfig.name) { api }: TestContextSlice,
  ): Promise<boolean> {
    return await api.validate();
  }
}
