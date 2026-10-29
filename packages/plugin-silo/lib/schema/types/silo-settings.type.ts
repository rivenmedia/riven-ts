import { ObjectType, Field } from "type-graphql";

@ObjectType()
export class SiloSettings {
  @Field()
  public apiKey!: string;
}
