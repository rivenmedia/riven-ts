import {
  Entity,
  Index,
  ManyToOne,
  PrimaryKey,
  Property,
} from "@mikro-orm/decorators/legacy";
import { type UUID, randomUUID } from "crypto";
import { Field, ID, ObjectType } from "type-graphql";

import { User } from "./index.ts";

import type { Ref } from "@mikro-orm/core";

@Entity()
@ObjectType()
export class Passkey {
  @Field(() => ID)
  @PrimaryKey({ type: "uuid" })
  id: UUID = randomUUID();

  @Field()
  @Property()
  name?: string;

  @Field()
  @Property()
  publicKey!: string;

  @Field()
  @Property()
  @Index()
  credentialID!: string;

  @Field()
  @Property()
  counter!: number;

  @Field()
  @Property()
  deviceType!: string;

  @Field()
  @Property({ default: false })
  backedUp!: boolean;

  @Field(() => [String])
  @Property({ type: "json" })
  transports?: string[];

  @Field(() => Date)
  @Property()
  createdAt: Date = new Date();

  @Field(() => String)
  @Property()
  aaguid?: string;

  @Field(() => User)
  @ManyToOne({ index: true })
  user!: Ref<User>;
}
