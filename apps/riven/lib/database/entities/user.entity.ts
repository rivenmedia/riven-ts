import { Collection, type Opt } from "@mikro-orm/core";
import {
  Entity,
  OneToMany,
  PrimaryKey,
  Property,
  Unique,
} from "@mikro-orm/decorators/legacy";
import { type UUID, randomUUID } from "crypto";
import { DateTime } from "luxon";
import { Field, ID, ObjectType } from "type-graphql";

import { Account, Passkey, Session } from "./index.ts";

@Entity()
@ObjectType()
export class User {
  @Field(() => ID)
  @PrimaryKey({ type: "uuid" })
  id: UUID = randomUUID();

  @Field()
  @Property()
  name!: string;

  @Field()
  @Property({ unique: true })
  email!: string;

  @Field()
  @Property({ default: false })
  emailVerified!: boolean;

  @Field()
  @Property()
  image?: string;

  @Field(() => Date)
  @Property()
  createdAt: Opt<Date> = DateTime.utc().toJSDate();

  @Field(() => Date)
  @Property({ onUpdate: () => DateTime.utc().toJSDate() })
  updatedAt!: Opt<Date>;

  @Field()
  @Property()
  @Unique()
  username?: string;

  @Field()
  @Property()
  displayUsername?: string;

  @Field()
  @Property()
  role?: string;

  @Field()
  @Property({ default: false })
  banned!: boolean;

  @Field()
  @Property()
  banReason?: string;

  @Field(() => Date, { nullable: true })
  @Property()
  banExpires?: Date | null;

  @Field()
  @Property()
  lastLoginMethod?: string;

  @Field(() => [Session])
  @OneToMany(() => Session, (session) => session.user, { orphanRemoval: true })
  sessions = new Collection<Session>(this);

  @Field(() => [Account])
  @OneToMany(() => Account, (account) => account.user, { orphanRemoval: true })
  accounts = new Collection<Account>(this);

  @Field(() => [Passkey])
  @OneToMany(() => Passkey, (passkey) => passkey.user, { orphanRemoval: true })
  passkeys = new Collection<Passkey>(this);
}
