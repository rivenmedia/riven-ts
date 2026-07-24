import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class TestSettings {
  @Field()
  public apiKey!: string;
}
