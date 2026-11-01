import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class Trailer {
  @Field(() => ID)
  public id!: string;

  @Field(() => String)
  public name!: string;

  @Field(() => String)
  public site!: string;

  @Field(() => String)
  public key!: string;

  @Field(() => String)
  public url!: string;
}
