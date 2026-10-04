import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class CastMember {
  @Field(() => String)
  public id!: string;

  @Field(() => String)
  public name!: string;

  @Field(() => String, { nullable: true })
  public character?: string | null;

  @Field(() => String, { nullable: true })
  public profilePath?: string | null;
}
