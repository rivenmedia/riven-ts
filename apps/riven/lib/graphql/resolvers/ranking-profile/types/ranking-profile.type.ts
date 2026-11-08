import { Field, ID, ObjectType } from "type-graphql";

@ObjectType()
export class RankingProfile {
  @Field(() => ID)
  public id!: string;

  @Field(() => String, { nullable: true })
  public slug!: string | null;

  @Field()
  public name!: string;

  @Field(() => String, { nullable: true })
  public description!: string | null;

  @Field({ description: "Built-in profiles are read-only presets." })
  public builtIn!: boolean;

  @Field()
  public isActive!: boolean;

  @Field(() => Object)
  public rankingModel!: Record<string, unknown>;

  @Field(() => Object)
  public settings!: Record<string, unknown>;

  @Field(() => Object, {
    description: "The profile's form values, with defaults filled in.",
  })
  public values!: Record<string, unknown>;
}
