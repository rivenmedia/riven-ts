import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class Rating {
  @Field()
  public logo!: string;

  @Field()
  public url!: string;

  @Field()
  public score!: string;
}
