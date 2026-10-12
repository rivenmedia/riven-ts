import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class ProductionCompany {
  @Field(() => ID)
  public id!: string;

  @Field(() => String)
  public name!: string;

  @Field(() => String)
  public logoPath!: string;

  @Field(() => String)
  public originCountry!: string;
}
