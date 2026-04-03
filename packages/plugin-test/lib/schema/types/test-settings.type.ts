import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class TestSettings {
  @Field(() => String)
  apiKey!: string;
}
