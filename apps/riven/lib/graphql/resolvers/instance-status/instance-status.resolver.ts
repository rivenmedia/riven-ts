import { Field, ObjectType, Query, Resolver } from "type-graphql";

@ObjectType()
class InstanceStatus {
  @Field()
  public setupRequired!: boolean;
}

@Resolver()
export class InstanceStatusResolver {
  @Query(() => InstanceStatus)
  public instanceStatus(): InstanceStatus {
    return {
      setupRequired: false,
    };
  }
}
