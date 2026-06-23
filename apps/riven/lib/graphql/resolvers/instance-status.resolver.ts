import { Field, Int, ObjectType, Query, Resolver } from "type-graphql";

@ObjectType()
class InstanceStatus {
  @Field()
  setupCompleted!: boolean;

  @Field()
  readyToComplete!: boolean;

  @Field(() => Int)
  enabledValidPluginCount!: number;

  @Field(() => Int)
  enabledProfileCount!: number;

  @Field(() => [String])
  blockers!: string[];
}

@Resolver()
export class InstanceStatusResolver {
  @Query(() => InstanceStatus)
  instanceStatus(): InstanceStatus {
    return {
      setupCompleted: false,
      readyToComplete: true,
      enabledValidPluginCount: 0,
      enabledProfileCount: 0,
      blockers: [],
    };
  }
}
