import {
  CreateRequestContext,
  Transactional,
} from "@mikro-orm/decorators/legacy";

import { RankingProfile } from "#database/entities/ranking-profile.entity.ts";
import { BaseService } from "#database/services/core/base-service.ts";
import { sparsifyProfileConfig } from "#ranking/sparsify-profile-config.ts";

import type { RankingPreset } from "#ranking/presets/index.ts";
import type { RankingProfileConfig } from "#ranking/ranking-profile-config.schema.ts";

interface RankingProfileInput {
  name: string;
  description: string | null;
  config: RankingProfileConfig;
}

export class RankingProfileService extends BaseService {
  @CreateRequestContext()
  public async list() {
    return this.em.find(
      RankingProfile,
      {},
      { orderBy: { builtIn: "desc", name: "asc" } },
    );
  }

  @CreateRequestContext()
  public async findById(id: string) {
    return this.em.findOne(RankingProfile, { id });
  }

  @CreateRequestContext()
  public async findBySlug(slug: string) {
    return this.em.findOne(RankingProfile, { slug });
  }

  @CreateRequestContext()
  public async nameExists(name: string, excludeId?: string) {
    const count = await this.em.count(RankingProfile, {
      name,
      ...(excludeId ? { id: { $ne: excludeId } } : {}),
    });

    return count > 0;
  }

  @CreateRequestContext()
  public async create({ name, description, config }: RankingProfileInput) {
    const profile = this.em.create(RankingProfile, {
      name,
      description,
      builtIn: false,
      rankingModel: config.rankingModel ?? {},
      settings: config.settings ?? {},
    });

    await this.em.flush();

    return profile;
  }

  @CreateRequestContext()
  public async update(
    id: string,
    { name, description, config }: RankingProfileInput,
  ) {
    const profile = await this.em.findOneOrFail(RankingProfile, { id });

    profile.name = name;
    profile.description = description;
    profile.rankingModel = config.rankingModel ?? {};
    profile.settings = config.settings ?? {};

    await this.em.flush();

    return profile;
  }

  @CreateRequestContext()
  public async delete(id: string) {
    await this.em.nativeDelete(RankingProfile, { id });
  }

  @CreateRequestContext()
  @Transactional()
  public async syncPresets(presets: readonly RankingPreset[]) {
    for (const preset of presets) {
      const config = sparsifyProfileConfig(preset.config);

      const data = {
        name: preset.name,
        description: preset.description,
        builtIn: true,
        rankingModel: config.rankingModel ?? {},
        settings: config.settings ?? {},
      };
      const existing = await this.em.findOne(RankingProfile, {
        slug: preset.slug,
      });

      if (existing) {
        this.em.assign(existing, data);
      } else {
        this.em.create(RankingProfile, { slug: preset.slug, ...data });
      }
    }

    const slugs = presets.map((preset) => preset.slug);
    const stale = await this.em.find(RankingProfile, {
      builtIn: true,
      slug: { $nin: slugs },
    });
    const removedSlugs = stale
      .map((row) => row.slug)
      .filter((slug) => slug !== null);

    this.em.remove(stale);
    await this.em.flush();

    return { removedSlugs };
  }
}
