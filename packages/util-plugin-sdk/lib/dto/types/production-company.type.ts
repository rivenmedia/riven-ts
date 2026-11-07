import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class ProductionCompany {
  @Field(() => ID)
  public id!: string;

  @Field(() => String)
  public name!: string;

  @Field(() => String, { nullable: true })
  public logoPath!: string | null;

  @Field(() => String)
  public originCountry!: string;
}
