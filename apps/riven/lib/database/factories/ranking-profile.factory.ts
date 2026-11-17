import { faker } from "@faker-js/faker";
import { Factory } from "@mikro-orm/seeder";
import { kebabCase } from "es-toolkit";

import { RankingProfile } from "#database/entities/ranking-profile.entity.ts";

import type { EntityData } from "@mikro-orm/core";

export class RankingProfileFactory extends Factory<RankingProfile> {
  public model = RankingProfile;

  protected override definition(
    input: EntityData<RankingProfile>,
  ): EntityData<RankingProfile> {
    const name = faker.lorem.words();
    const slug = kebabCase(name);

    return {
      name,
      slug,
      description: faker.lorem.sentence(),
      ...input,
    };
  }
}
