import { OptionalProps } from "@mikro-orm/core";
import {
  Entity,
  PrimaryKey,
  Property,
  Unique,
} from "@mikro-orm/decorators/legacy";
import { randomUUID } from "node:crypto";
import { Field, ID, ObjectType } from "type-graphql";

import type { RankingProfileConfig } from "#ranking/ranking-profile-config.schema.ts";

@Entity()
@ObjectType()
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

  @Field(() => ID)
  @PrimaryKey({ type: "uuid" })
  public id: string = randomUUID();

  // Set only for built-in presets
  @Field(() => String, { nullable: true })
  @Property()
  @Unique()
  public slug: string | null = null;

  @Field()
  @Property({ type: "text" })
  @Unique()
  public name!: string;

  @Field(() => String, { nullable: true })
  @Property()
  public description: string | null = null;

  @Field(() => Boolean, {
    description: "Built-in profiles are read-only presets.",
  })
  @Property({ default: false })
  public builtIn = false;

  @Field(() => Object)
  @Property({ type: "jsonb", nullable: false, default: "{}" })
  public rankingModel: NonNullable<RankingProfileConfig["rankingModel"]> = {};

  @Field(() => Object)
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
