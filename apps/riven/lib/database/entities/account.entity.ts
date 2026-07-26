import {
  Entity,
  ManyToOne,
  PrimaryKey,
  Property,
} from "@mikro-orm/decorators/legacy";
import { DateTime } from "luxon";
import { randomUUID } from "node:crypto";
import { Field, ID, ObjectType } from "type-graphql";

import { User } from "./index.ts";

import type { Opt, Ref } from "@mikro-orm/core";
import type { UUID } from "node:crypto";

@Entity()
@ObjectType()
export class Account {
  @Field(() => ID)
  @PrimaryKey({ type: "uuid" })
  public id: UUID = randomUUID();

  @Field()
  @Property()
  public accountId!: string;

  @Field()
  @Property()
  public providerId!: string;

  @Field()
  @Property()
  public accessToken?: string;

  @Field()
  @Property()
  public refreshToken?: string;

  @Field()
  @Property()
  public idToken?: string;

  @Field(() => Date)
  @Property()
  public accessTokenExpiresAt?: Opt<Date>;

  @Field(() => Date)
  @Property()
  public refreshTokenExpiresAt?: Opt<Date>;

  @Field()
  @Property()
  public scope?: string;

  @Field()
  @Property()
  public password?: string;

  @Field(() => Date)
  @Property()
  public createdAt: Opt<Date> = DateTime.utc().toJSDate();

  @Field(() => Date)
  @Property({ onUpdate: () => DateTime.utc().toJSDate() })
  public updatedAt!: Opt<Date>;

  @Field(() => User)
  @ManyToOne({ index: true })
  public user!: Ref<User>;
}
