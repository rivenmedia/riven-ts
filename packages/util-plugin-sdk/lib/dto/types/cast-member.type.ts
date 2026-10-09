import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class CastMember {
  @Field(() => String)
  public id!: string;

  @Field(() => String)
  public name!: string;

  @Field(() => String)
  public character!: string;

  @Field(() => String, { nullable: true })
  public profileUrl?: string | null;
}
