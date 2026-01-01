import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class TestSettings {
  @Field()
  apiKey!: string;
}
