import {
  Entity,
  Index,
  ManyToOne,
  PrimaryKey,
  Property,
} from "@mikro-orm/decorators/legacy";
import { randomUUID } from "node:crypto";
import { Field, ID, ObjectType } from "type-graphql";

import { User } from "./index.ts";

import type { Ref } from "@mikro-orm/core";
import type { UUID } from "node:crypto";

@Entity({ schema: "auth_db" })
@ObjectType()
export class Passkey {
  @Field(() => ID)
  @PrimaryKey({ type: "uuid" })
  public id: UUID = randomUUID();

  @Field(() => String, { nullable: true })
  @Property()
  public name?: string;

  @Field()
  @Property()
  public publicKey!: string;

  @Field()
  @Property()
  @Index()
  public credentialID!: string;

  @Field()
  @Property()
  public counter!: number;

  @Field()
  @Property()
  public deviceType!: string;

  @Field()
  @Property({ default: false })
  public backedUp!: boolean;

  @Field(() => [String], { nullable: true })
  @Property({ type: "json" })
  public transports?: string[];

  @Field(() => Date)
  @Property()
  public createdAt: Date = new Date();

  @Field(() => String, { nullable: true })
  @Property()
  public aaguid?: string;

  @Field(() => User)
  @ManyToOne({ index: true })
  public user!: Ref<User>;
}
