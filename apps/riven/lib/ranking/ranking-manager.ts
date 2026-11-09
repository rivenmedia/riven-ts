import { GraphQLError } from "graphql";

import { findFreeName } from "./find-free-name.ts";
import { getActiveRankingProfile } from "./get-active-ranking-profile.ts";
import { invalidateRankingEngine } from "./ranking-engine.ts";
import {
  buildRankingProfileJsonSchema,
  fromProfileFormValues,
  toProfileFormValues,
} from "./ranking-profile-form.ts";
import { RANKING_NAMESPACE } from "./ranking-settings-section.schema.ts";
import { sparsifyProfileConfig } from "./sparsify-profile-config.ts";

import type { RankingProfile } from "#database/entities/ranking-profile.entity.ts";
import type { SettingsIssue } from "#graphql/resolvers/settings/types/settings-issue.type.ts";
import type { ActiveRankingProfileDeps } from "./get-active-ranking-profile.ts";

interface RankingProfileView extends Pick<
  RankingProfile,
  "rankingModel" | "settings"
> {
  id: string;
  slug: string | null;
  name: string;
  description: string | null;
  builtIn: boolean;
  isActive: boolean;
  /** The profile's form values, with `RTN` defaults filled in. */
  values: Record<string, unknown>;
}

const BUILT_IN_ISSUE = {
  path: "",
  message: "Built-in profiles can't be changed. Duplicate it to customise.",
} as const satisfies SettingsIssue;

const ACTIVE_DELETE_ISSUE = {
  path: "",
  message: "The active profile can't be deleted. Select another profile first.",
} as const satisfies SettingsIssue;

const NAME_TAKEN_ISSUE = {
  path: "name",
  message: "A profile with this name already exists.",
} as const satisfies SettingsIssue;

function notFound(message: string) {
  return new GraphQLError(message, { extensions: { code: "NOT_FOUND" } });
}

/**
 * The ranking profiles domain layer: listing, editing, duplicating and
 * selecting profiles. Built-in presets are read-only and profiles are stored
 * sparsely. Changes that affect ranking invalidate the ranking engine.
 */
export class RankingManager {
  readonly #deps: ActiveRankingProfileDeps;

  public constructor(deps: ActiveRankingProfileDeps) {
    this.#deps = deps;
  }

  public async list() {
    const profiles = await this.#deps.rankingProfileService.list();
    const activeId = await this.#activeProfileId();

    return profiles.map<RankingProfileView>((profile) => ({
      id: profile.id,
      slug: profile.slug,
      name: profile.name,
      description: profile.description,
      builtIn: profile.builtIn,
      isActive: profile.id === activeId,
      rankingModel: profile.rankingModel,
      settings: profile.settings,
      values: toProfileFormValues(profile),
    }));
  }

  public getSchema() {
    return buildRankingProfileJsonSchema();
  }

  public async create(values: Record<string, unknown>) {
    const result = fromProfileFormValues(values);

    if (!("config" in result)) {
      return result.issues;
    }

    const { name, description, config } = result;

    if (await this.#deps.rankingProfileService.nameExists(name)) {
      return [NAME_TAKEN_ISSUE];
    }

    await this.#deps.rankingProfileService.create({
      name,
      description,
      config,
    });

    return [];
  }

  public async update(id: string, values: Record<string, unknown>) {
    const profile = await this.#findProfile(id);

    if (profile.builtIn) {
      return [BUILT_IN_ISSUE];
    }

    const result = fromProfileFormValues(values);

    if (!("config" in result)) {
      return result.issues;
    }

    const { name, description, config } = result;

    if (await this.#deps.rankingProfileService.nameExists(name, id)) {
      return [NAME_TAKEN_ISSUE];
    }

    await this.#deps.rankingProfileService.update(id, {
      name,
      description,
      config,
    });

    if (id === (await this.#activeProfileId())) {
      invalidateRankingEngine();
    }

    return [];
  }

  public async delete(id: string) {
    const profile = await this.#findProfile(id);

    if (profile.builtIn) {
      return [BUILT_IN_ISSUE];
    }

    if (id === (await this.#activeProfileId())) {
      return [ACTIVE_DELETE_ISSUE];
    }

    await this.#deps.rankingProfileService.delete(id);

    return [];
  }

  public async duplicate(id: string) {
    const profile = await this.#findProfile(id);

    await this.#deps.rankingProfileService.create({
      name: await this.#copyName(profile.name),
      description: profile.description,
      config: sparsifyProfileConfig({
        rankingModel: profile.rankingModel,
        settings: profile.settings,
      }),
    });

    return [];
  }

  public async select(id: string) {
    await this.#findProfile(id);

    await this.#deps.settingsService.writeValues(RANKING_NAMESPACE, {
      upsert: { activeProfileId: id },
      delete: [],
    });

    invalidateRankingEngine();

    return [];
  }

  async #findProfile(id: string) {
    const profile = await this.#deps.rankingProfileService.findById(id);

    if (!profile) {
      throw notFound(`Unknown ranking profile "${id}"`);
    }

    return profile;
  }

  async #activeProfileId() {
    const active = await getActiveRankingProfile(this.#deps);

    return active.id;
  }

  /** `"<name> (copy)"`, then `"<name> (copy 2)"`, `"<name> (copy 3)"`… */
  async #copyName(name: string) {
    return findFreeName(name, "copy", (candidate) =>
      this.#deps.rankingProfileService.nameExists(candidate),
    );
  }
}
