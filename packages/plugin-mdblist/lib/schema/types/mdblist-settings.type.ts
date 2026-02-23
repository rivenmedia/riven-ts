import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class MdblistSettings {
  @Field((_type) => String)
  apiKey!: string;

  @Field((_type) => [String])
  lists!: string[];
}
