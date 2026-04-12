import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class TorrentioSettings {
  @Field(() => String)
  apiKey!: string;
}
