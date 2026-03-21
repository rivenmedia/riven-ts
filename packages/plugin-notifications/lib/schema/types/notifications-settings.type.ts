import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class NotificationsSettings {
  @Field((_type) => [String])
  urls!: string[];
}
