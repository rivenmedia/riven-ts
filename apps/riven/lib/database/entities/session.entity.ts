import {
  Entity,
  Index,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from "@mikro-orm/decorators/legacy";
import { DateTime } from "luxon";
import { randomUUID } from "node:crypto";
import { Field, ID, ObjectType } from "type-graphql";

import { User } from "./index.ts";

import type { Opt, Ref } from "@mikro-orm/core";
import type { UUID } from "node:crypto";

@Entity()
@ObjectType()
export class Session {
  @Field(() => ID)
  @PrimaryKey({ type: "uuid" })
  @Index()
  public id: UUID = randomUUID();

  @Field()
  @Property()
  public expiresAt!: Date;

  @Field()
  @Property()
  @Unique()
  public token!: string;

  @Field(() => Date)
  @Property()
  public createdAt: Opt<Date> = DateTime.utc().toJSDate();

  @Field(() => Date)
  @Property({ onUpdate: () => DateTime.utc().toJSDate() })
  public updatedAt!: Opt<Date>;

  @Field()
  @Property()
  public ipAddress?: string;

  @Field()
  @Property()
  public userAgent?: string;

  @Field()
  @Property()
  public impersonatedBy?: string;

  @Field(() => User)
  @ManyToOne()
  public user!: Ref<User>;
}
