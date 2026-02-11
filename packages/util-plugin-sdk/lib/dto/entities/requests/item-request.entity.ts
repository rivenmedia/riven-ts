import {
  Entity,
  Enum,
  type Opt,
  PrimaryKey,
  Property,
  Unique,
} from "@mikro-orm/core";
import { IsNumberString, IsOptional, Matches } from "class-validator";
import { Field, ID, ObjectType, registerEnumType } from "type-graphql";
import z from "zod";

import { DateTime } from "../../../helpers/dates.ts";

export const RequestType = z.enum(["movie", "show"]);

export type RequestType = z.infer<typeof RequestType>;

export const ItemRequestState = z.enum(["requested", "completed", "failed"]);

export type ItemRequestState = z.infer<typeof ItemRequestState>;

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

  @Field(() => String, { nullable: true })
  @Property()
  @Matches(/^tt\d+$/)
  @IsOptional()
  @Unique()
  imdbId?: string | null;

  @Field(() => String, { nullable: true })
  @Property()
  @IsNumberString()
  @IsOptional()
  @Unique()
  tmdbId?: string | null;

  @Field(() => String, { nullable: true })
  @Property()
  @IsNumberString()
  @IsOptional()
  @Unique()
  tvdbId?: string | null;

  @Field()
  @Enum(() => RequestType.enum)
  type!: RequestType;

  @Field()
  @Property()
  requestedBy!: string;

  @Field(() => Date)
  @Property()
  createdAt: Opt<Date> = DateTime.now().toJSDate();

  @Field(() => Date, { nullable: true })
  @Property()
  completedAt?: Opt<Date> | null;

  @Field()
  @Enum(() => ItemRequestState.enum)
  state!: ItemRequestState;
}
