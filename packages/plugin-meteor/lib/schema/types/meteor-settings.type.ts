import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class MeteorSettings {
  @Field()
  apiKey!: string;
}
