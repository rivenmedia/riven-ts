import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class InstanceStatus {
  @Field()
  public setupRequired!: boolean;
}
