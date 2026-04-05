import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class StremThruSettings {
  @Field(() => String)
  apiKey!: string;
}
