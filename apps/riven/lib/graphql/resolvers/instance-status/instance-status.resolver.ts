import { Field, ObjectType, Query, Resolver } from "type-graphql";

@ObjectType()
class InstanceStatus {
  @Field()
  setupRequired!: boolean;
}

@Resolver()
export class InstanceStatusResolver {
  @Query(() => InstanceStatus)
  instanceStatus(): InstanceStatus {
    return {
      setupRequired: true,
    };
  }
}
