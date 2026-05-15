import { Field, Int, ObjectType } from "type-graphql";

@ObjectType({
  description:
    "BullMQ job counts partitioned by lifecycle state. Maps 1:1 onto the relevant subset of `Queue#getJobCounts()`.",
})
export class QueueCounts {
  @Field(() => Int)
  waiting!: number;

  @Field(() => Int)
  active!: number;

  @Field(() => Int)
  completed!: number;

  @Field(() => Int)
  failed!: number;

  @Field(() => Int)
  delayed!: number;

  @Field(() => Int)
  paused!: number;
}

@ObjectType({
  description:
    "A registered BullMQ queue with its current job-count breakdown. One entry per queue in the live registry.",
})
export class QueueOverview {
  @Field(() => String)
  name!: string;

  @Field(() => QueueCounts)
  counts!: QueueCounts;
}
