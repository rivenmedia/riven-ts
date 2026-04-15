import { PrimaryKey, Property } from "@mikro-orm/decorators/legacy";
import { DateTime } from "luxon";
import { type UUID, randomUUID } from "node:crypto";
import { Field, ID, InterfaceType } from "type-graphql";

import type { Opt } from "@mikro-orm/core";

@InterfaceType()
export abstract class Node {
  @Field((_type) => ID)
  @PrimaryKey({ type: "uuid" })
  id: UUID = randomUUID();

  @Field(() => Date)
  @Property()
  createdAt: Opt<Date> = new Date();

  @Field(() => Date, { nullable: true })
  @Property({ onUpdate: () => DateTime.now().toJSDate() })
  updatedAt?: Opt<Date>;
}
