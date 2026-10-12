import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class SpokenLanguage {
  @Field()
  public name!: string;

  @Field()
  public iso6391Code!: string;

  @Field()
  public englishName!: string;
}
