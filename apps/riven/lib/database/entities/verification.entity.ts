import {
  Entity,
  Index,
  PrimaryKey,
  Property,
} from "@mikro-orm/decorators/legacy";
import { randomUUID } from "node:crypto";
import { Field, ID, ObjectType } from "type-graphql";

import type { UUID } from "node:crypto";

@Entity()
@ObjectType()
export class Verification {
  @Field(() => ID)
  @PrimaryKey({ type: "uuid" })
  public id: UUID = randomUUID();

  @Field()
  @Property()
  @Index()
  public identifier!: string;

  @Field()
  @Property()
  public value!: string;

  @Field(() => Date)
  @Property()
  public expiresAt!: Date;

  @Field(() => Date)
  @Property()
  public createdAt: Date = new Date();

  @Field(() => Date)
  @Property({ onUpdate: () => new Date() })
  public updatedAt!: Date;
}
