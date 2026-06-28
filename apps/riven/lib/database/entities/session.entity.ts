import {
  Entity,
  Index,
  ManyToOne,
  PrimaryKey,
  Property,
  Unique,
} from "@mikro-orm/decorators/legacy";
import { type UUID, randomUUID } from "crypto";
import { DateTime } from "luxon";
import { Field, ID, ObjectType } from "type-graphql";

import { User } from "./index.ts";

import type { Opt, Ref } from "@mikro-orm/core";

@Entity()
@ObjectType()
export class Session {
  @Field(() => ID)
  @PrimaryKey({ type: "uuid" })
  @Index()
  id: UUID = randomUUID();

  @Field()
  @Property()
  expiresAt!: Date;

  @Field()
  @Property()
  @Unique()
  token!: string;

  @Field(() => Date)
  @Property()
  createdAt: Opt<Date> = DateTime.utc().toJSDate();

  @Field(() => Date)
  @Property({ onUpdate: () => DateTime.utc().toJSDate() })
  updatedAt!: Opt<Date>;

  @Field()
  @Property()
  ipAddress?: string;

  @Field()
  @Property()
  userAgent?: string;

  @Field()
  @Property()
  impersonatedBy?: string;

  @Field(() => User)
  @ManyToOne()
  user!: Ref<User>;
}
