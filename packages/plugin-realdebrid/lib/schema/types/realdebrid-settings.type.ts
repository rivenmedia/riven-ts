import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class RealDebridSettings {
  @Field()
  apiKey!: string;
}
