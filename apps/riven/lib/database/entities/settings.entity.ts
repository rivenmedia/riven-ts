import { PrimaryKeyProp } from "@mikro-orm/core";
import { Entity, Property } from "@mikro-orm/decorators/legacy";
import { JSONResolver } from "graphql-scalars";
import { Field, ObjectType } from "type-graphql";

@Entity()
@ObjectType()
export class Setting {
  [PrimaryKeyProp]?: ["key", "namespace"];

  @Field()
  @Property({ primary: true })
  key!: string;

  @Field(() => JSONResolver, { nullable: true })
  @Property({ type: "jsonb" })
  value?: unknown;

  @Field()
  @Property({ primary: true })
  namespace!: string;
}
