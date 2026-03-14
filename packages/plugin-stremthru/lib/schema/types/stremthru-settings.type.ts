import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class StremThruSettings {
  @Field()
  apiKey!: string;
}
