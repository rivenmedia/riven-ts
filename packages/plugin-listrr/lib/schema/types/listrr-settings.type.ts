import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class ListrrSettings {
  @Field()
  apiKey!: string;
}
