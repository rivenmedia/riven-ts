import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class AltmountSettings {
  @Field()
  altmountUrl!: string;

  @Field()
  altmountApiKey!: string;

  @Field()
  pollIntervalMs!: number;

  @Field()
  pollTimeoutMs!: number;
}
