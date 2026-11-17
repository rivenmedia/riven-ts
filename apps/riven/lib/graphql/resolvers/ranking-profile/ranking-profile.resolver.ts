import {
  Arg,
  FieldResolver,
  ID,
  Mutation,
  Query,
  Resolver,
  Root,
} from "type-graphql";

import { RankingProfile } from "#database/entities/ranking-profile.entity.ts";
import { CoreContext } from "#graphql/decorators/core-context.ts";
import { toProfileFormValues } from "#ranking/ranking-profile-form.ts";

import { SettingsMutationResult } from "../settings/types/settings-mutation-result.type.ts";

import type { SettingsIssue } from "../settings/types/settings-issue.type.ts";

const toResult = (issues: SettingsIssue[]): SettingsMutationResult => ({
  success: issues.length === 0,
  issues,
});

@Resolver(() => RankingProfile)
export class RankingProfileResolver {
  @Query(() => [RankingProfile])
  public async rankingProfiles(@CoreContext() { rankingManager }: CoreContext) {
    return rankingManager.list();
  }

  @FieldResolver(() => Boolean)
  public async isActive(
    @Root() profile: RankingProfile,
    @CoreContext() { rankingManager }: CoreContext,
  ) {
    const activeProfileId = await rankingManager.getActiveProfileId();

    return profile.id === activeProfileId;
  }

  @FieldResolver(() => Object, {
    description: "The profile's form values, with defaults filled in.",
  })
  public values(@Root() profile: RankingProfile) {
    return toProfileFormValues(profile);
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
