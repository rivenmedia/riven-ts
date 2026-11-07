import { Arg, ID, Mutation, Query, Resolver } from "type-graphql";

import { CoreContext } from "#graphql/decorators/core-context.ts";

import { PluginList } from "./types/plugin-list.type.ts";
import { SettingsMutationResult } from "./types/settings-mutation-result.type.ts";
import { SettingsSection } from "./types/settings-section.type.ts";

import type { SettingsIssue } from "./types/settings-issue.type.ts";

const toResult = (issues: SettingsIssue[]): SettingsMutationResult => ({
  success: issues.length === 0,
  issues,
});

@Resolver()
export class SettingsResolver {
  @Query(() => SettingsSection)
  public async settingsSection(
    @CoreContext() { settingsManager }: CoreContext,
    @Arg("id", () => ID) id: string,
  ) {
    return settingsManager.getSection(id);
  }

  @Query(() => PluginList)
  public async settingsPlugins(
    @CoreContext() { settingsManager }: CoreContext,
  ) {
    return settingsManager.listPlugins();
  }

  @Mutation(() => SettingsMutationResult, {
    description:
      "Saves the given values for a settings section and resets the `reset` fields to their defaults. Nothing is saved if any value is invalid.",
  })
  public async updateSettingsSection(
    @CoreContext() { settingsManager }: CoreContext,
    @Arg("id", () => ID) id: string,
    @Arg("values", () => Object) values: Record<string, unknown>,
    @Arg("reset", () => [String], {
      defaultValue: [],
      description: "Dotted paths of fields whose stored values are removed.",
    })
    reset: string[],
  ) {
    return toResult(await settingsManager.updateSection(id, values, reset));
  }

  @Mutation(() => SettingsMutationResult, {
    description: "Resets the given fields to their defaults.",
  })
  public async resetSettingsFields(
    @CoreContext() { settingsManager }: CoreContext,
    @Arg("id", () => ID) id: string,
    @Arg("paths", () => [String]) paths: string[],
  ) {
    return toResult(await settingsManager.resetFields(id, paths));
  }

  @Mutation(() => SettingsMutationResult)
  public async setPluginEnabled(
    @CoreContext() { settingsManager }: CoreContext,
    @Arg("id", () => ID) id: string,
    @Arg("enabled") enabled: boolean,
  ) {
    return toResult(await settingsManager.setPluginEnabled(id, enabled));
  }
}
