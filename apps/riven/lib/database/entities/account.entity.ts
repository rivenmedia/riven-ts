import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
} from "@mikro-orm/decorators/legacy";
import { type UUID, randomUUID } from "crypto";
import { DateTime } from "luxon";
import { Field, ID, ObjectType } from "type-graphql";

import { User } from "./index.ts";

import type { Opt, Ref } from "@mikro-orm/core";

@Entity()
@ObjectType()
export class Account {
  @Field(() => ID)
  @PrimaryKey({ type: "uuid" })
  id: UUID = randomUUID();

  @Field()
  @Property()
  accountId!: string;

  @Field()
  @Property()
  providerId!: string;

  @Field()
  @Property()
  accessToken?: string;

  @Field()
  @Property()
  refreshToken?: string;

  @Field()
  @Property()
  idToken?: string;

  @Field(() => Date)
  @Property()
  accessTokenExpiresAt?: Opt<Date>;

  @Field(() => Date)
  @Property()
  refreshTokenExpiresAt?: Opt<Date>;

  @Field()
  @Property()
  scope?: string;

  @Field()
  @Property()
  password?: string;

  @Field(() => Date)
  @Property()
  createdAt: Opt<Date> = DateTime.utc().toJSDate();

  @Field(() => Date)
  @Property({ onUpdate: () => DateTime.utc().toJSDate() })
  updatedAt!: Opt<Date>;

  @Field(() => User)
  @ManyToOne({ index: true })
  user!: Ref<User>;
}
