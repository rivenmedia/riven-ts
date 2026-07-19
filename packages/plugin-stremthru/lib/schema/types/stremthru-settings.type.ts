import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class StremThruSettings {
  @Field()
  public apiKey!: string;
}
