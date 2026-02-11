import { Entity, Enum, type Opt, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ID, ObjectType, registerEnumType } from "type-graphql";
import z from "zod";

import { DateTime } from "../../../helpers/dates.ts";

export const RequestType = z.enum(["movie", "show"]);

export type RequestType = z.infer<typeof RequestType>;

registerEnumType(RequestType.enum, {
  name: "RequestType",
  description: "The type of a media item request, either 'movie' or 'show'.",
});

@ObjectType()
@Entity()
export class ItemRequest {
  @Field(() => ID)
  @PrimaryKey()
  id!: Opt<number>;

  @Field()
  @Property()
  imdbId?: string;

  @Field()
  @Property()
  tmdbId?: string;

  @Field()
  @Property()
  tvdbId?: string;

  @Field()
  @Enum(() => RequestType.enum)
  type!: RequestType;

  @Field()
  @Property()
  source!: string;

  @Field(() => Date)
  @Property()
  createdAt: Opt<Date> = DateTime.now().toJSDate();

  @Field(() => Date, { nullable: true })
  @Property()
  completedAt?: Opt<Date>;

  @Field()
  @Enum()
  state!: "requested" | "completed" | "failed";
}
