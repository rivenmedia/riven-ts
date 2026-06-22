import { Field, ObjectType, Query, Resolver } from "type-graphql";

@ObjectType()
class InstanceStatus {
  @Field()
  setupCompleted!: boolean;
}

@Resolver()
export class InstanceStatusResolver {
  @Query(() => InstanceStatus)
  instanceStatus(): InstanceStatus {
    return {
      setupCompleted: true,
    };
  }
}
