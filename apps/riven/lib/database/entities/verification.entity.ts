import {
  Entity,
  Index,
  PrimaryKey,
  Property,
} from "@mikro-orm/decorators/legacy";
import { type UUID, randomUUID } from "crypto";
import { Field, ID, ObjectType } from "type-graphql";

@Entity()
@ObjectType()
export class Verification {
  @Field(() => ID)
  @PrimaryKey({ type: "uuid" })
  id: UUID = randomUUID();

  @Field()
  @Property()
  @Index()
  identifier!: string;

  @Field()
  @Property()
  value!: string;

  @Field(() => Date)
  @Property()
  expiresAt!: Date;

  @Field(() => Date)
  @Property()
  createdAt: Date = new Date();

  @Field(() => Date)
  @Property({ onUpdate: () => new Date() })
  updatedAt!: Date;
}
