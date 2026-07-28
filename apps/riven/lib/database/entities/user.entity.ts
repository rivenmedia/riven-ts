import { Collection } from "@mikro-orm/core";
import {
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
  Unique,
} from "@mikro-orm/decorators/legacy";
import { DateTime } from "luxon";
import { randomUUID } from "node:crypto";
import { Field, ID, ObjectType } from "type-graphql";

import { Account, Passkey, Session } from "./index.ts";

import type { Opt } from "@mikro-orm/core";
import type { UUID } from "node:crypto";

@Entity()
@ObjectType()
export class User {
  @Field(() => ID)
  @PrimaryKey({ type: "uuid" })
  public id: UUID = randomUUID();

  @Field()
  @Property()
  public name!: string;

  @Field()
  @Property({ unique: true })
  public email!: string;

  @Field()
  @Property({ default: false })
  public emailVerified!: boolean;

  @Field()
  @Property()
  public image?: string;

  @Field(() => Date)
  @Property()
  public createdAt: Opt<Date> = DateTime.utc().toJSDate();

  @Field(() => Date)
  @Property({ onUpdate: () => DateTime.utc().toJSDate() })
  public updatedAt!: Opt<Date>;

  @Field()
  @Property()
  @Unique()
  public username?: string;

  @Field()
  @Property()
  public displayUsername?: string;

  @Field()
  @Property()
  public role?: string;

  @Field()
  @Property({ default: false })
  public banned!: boolean;

  @Field()
  @Property()
  public banReason?: string;

  @Field(() => Date, { nullable: true })
  @Property()
  public banExpires?: Date | null;

  @Field()
  @Property()
  public lastLoginMethod?: string;

  @Field(() => [Session])
  @OneToMany(() => Session, (session) => session.user, { orphanRemoval: true })
  public sessions = new Collection<Session>(this);

  @Field(() => [Account])
  @OneToMany(() => Account, (account) => account.user, { orphanRemoval: true })
  public accounts = new Collection<Account>(this);

  @Field(() => [Passkey])
  @OneToMany(() => Passkey, (passkey) => passkey.user, { orphanRemoval: true })
  public passkeys = new Collection<Passkey>(this);
}
