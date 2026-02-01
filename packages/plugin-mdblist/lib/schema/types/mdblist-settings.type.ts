import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class MdblistSettings {
  @Field()
  apiKey!: string;
}
