import { Arg, ID, Mutation, Query, Resolver } from "type-graphql";

import { CoreContext } from "#graphql/decorators/core-context.ts";

import { SettingsMutationResult } from "../settings/types/settings-mutation-result.type.ts";
import { RankingProfile } from "./types/ranking-profile.type.ts";

import type { SettingsIssue } from "../settings/types/settings-issue.type.ts";

const toResult = (issues: SettingsIssue[]): SettingsMutationResult => ({
  success: issues.length === 0,
  issues,
});

@Resolver()
export class RankingProfileResolver {
  @Query(() => [RankingProfile])
  public async rankingProfiles(@CoreContext() { rankingManager }: CoreContext) {
    return rankingManager.list();
  }

  @Query(() => Object, {
    description: "The JSON schema describing a ranking profile's form values.",
  })
  public rankingProfileSchema(@CoreContext() { rankingManager }: CoreContext) {
    return rankingManager.getSchema();
  }

  @Mutation(() => SettingsMutationResult)
  public async createRankingProfile(
    @CoreContext() { rankingManager }: CoreContext,
    @Arg("values", () => Object) values: Record<string, unknown>,
  ) {
    return toResult(await rankingManager.create(values));
  }

  @Mutation(() => SettingsMutationResult)
  public async updateRankingProfile(
    @CoreContext() { rankingManager }: CoreContext,
    @Arg("id", () => ID) id: string,
    @Arg("values", () => Object) values: Record<string, unknown>,
  ) {
    return toResult(await rankingManager.update(id, values));
  }

  @Mutation(() => SettingsMutationResult)
  public async deleteRankingProfile(
    @CoreContext() { rankingManager }: CoreContext,
    @Arg("id", () => ID) id: string,
  ) {
    return toResult(await rankingManager.delete(id));
  }

  @Mutation(() => SettingsMutationResult)
  public async duplicateRankingProfile(
    @CoreContext() { rankingManager }: CoreContext,
    @Arg("id", () => ID) id: string,
  ) {
    return toResult(await rankingManager.duplicate(id));
  }

  @Mutation(() => SettingsMutationResult)
  public async selectRankingProfile(
    @CoreContext() { rankingManager }: CoreContext,
    @Arg("id", () => ID) id: string,
  ) {
    return toResult(await rankingManager.select(id));
  }
}
