import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class CometSettings {
  @Field()
  apiKey!: string;
}
