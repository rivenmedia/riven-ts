import { PrimaryKeyProp } from "@mikro-orm/core";
import { Entity, Property } from "@mikro-orm/decorators/legacy";
import { JSONResolver } from "graphql-scalars";
import { Field, ObjectType } from "type-graphql";

@Entity()
@ObjectType()
export class Setting {
  public [PrimaryKeyProp]?: ["key", "namespace"];

  @Field()
  @Property({ primary: true })
  public key!: string;

  @Field(() => JSONResolver, { nullable: true })
  @Property({ type: "jsonb" })
  public value?: unknown;

  @Field()
  @Property({ primary: true })
  public namespace!: string;
}
