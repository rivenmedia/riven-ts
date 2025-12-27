import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class TestSettings {
  @Field()
  apiKey!: string;
}
