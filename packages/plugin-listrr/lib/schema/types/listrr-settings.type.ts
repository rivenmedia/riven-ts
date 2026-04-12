import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class ListrrSettings {
  @Field(() => String)
  apiKey!: string;
}
