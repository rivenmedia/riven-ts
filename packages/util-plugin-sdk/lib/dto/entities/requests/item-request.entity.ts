import { Entity, Enum, PrimaryKey, Property } from "@mikro-orm/core";
import { Field, ObjectType, registerEnumType } from "type-graphql";
import z from "zod";

export const RequestType = z.enum(["movie", "show"]);

export type RequestType = z.infer<typeof RequestType>;

registerEnumType(RequestType.enum, {
  name: "RequestType",
  description: "The type of a media item request, either 'movie' or 'show'.",
});

@ObjectType()
@Entity()
export class ItemRequest {
  @Field()
  @PrimaryKey()
  id!: number;

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
}
