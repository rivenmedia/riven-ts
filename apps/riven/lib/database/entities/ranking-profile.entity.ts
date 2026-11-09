import { OptionalProps } from "@mikro-orm/core";
import {
  Entity,
  PrimaryKey,
  Property,
  Unique,
} from "@mikro-orm/decorators/legacy";
import { randomUUID } from "node:crypto";

import type { RankingProfileConfig } from "#ranking/ranking-profile-config.schema.ts";

@Entity()
export class RankingProfile {
  public [OptionalProps]?:
    | "id"
    | "slug"
    | "description"
    | "builtIn"
    | "rankingModel"
    | "settings"
    | "createdAt"
    | "updatedAt";

  @PrimaryKey({ type: "uuid" })
  public id: string = randomUUID();

  // Set only for built-in presets
  @Property()
  @Unique()
  public slug: string | null = null;

  @Property({ type: "text" })
  @Unique()
  public name!: string;

  @Property()
  public description: string | null = null;

  @Property({ default: false })
  public builtIn = false;

  @Property({ type: "jsonb", nullable: false, default: "{}" })
  public rankingModel: NonNullable<RankingProfileConfig["rankingModel"]> = {};

  @Property({ type: "jsonb", nullable: false, default: "{}" })
  public settings: NonNullable<RankingProfileConfig["settings"]> = {};

  @Property({ onCreate: () => new Date() })
  public createdAt: Date = new Date();

  @Property({
    type: "datetime",
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  public updatedAt: Date = new Date();
}
