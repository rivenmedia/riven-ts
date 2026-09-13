import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class NotificationsSettings {
  @Field(() => [String])
  public urls!: string[];
}
