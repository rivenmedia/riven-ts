import { OptionalProps } from "@mikro-orm/core";
import { Entity, Property, Unique } from "@mikro-orm/decorators/legacy";

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

  @Property({ type: "uuid", primary: true })
  public id: string = crypto.randomUUID();

  // Set only for built-in presets
  @Property({ type: "text", nullable: true })
  @Unique()
  public slug: string | null = null;

  @Property({ type: "text" })
  @Unique()
  public name!: string;

  @Property({ type: "text", nullable: true })
  public description: string | null = null;

  @Property({ type: "boolean", default: false })
  public builtIn = false;

  @Property({ type: "jsonb", nullable: false, default: "{}" })
  public rankingModel: NonNullable<RankingProfileConfig["rankingModel"]> = {};

  @Property({ type: "jsonb", nullable: false, default: "{}" })
  public settings: NonNullable<RankingProfileConfig["settings"]> = {};

  @Property({ type: "datetime", onCreate: () => new Date() })
  public createdAt: Date = new Date();

  @Property({
    type: "datetime",
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
  })
  public updatedAt: Date = new Date();
}
