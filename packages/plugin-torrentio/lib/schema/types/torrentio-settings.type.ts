import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class TorrentioSettings {
  @Field()
  public apiKey!: string;
}
