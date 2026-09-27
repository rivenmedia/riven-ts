import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class Genre {
  @Field(() => ID)
  public id!: string;

  @Field()
  public name!: string;
}
