import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class ItemImage {
  @Field()
  public url!: string;

  @Field()
  public height!: number;

  @Field()
  public width!: number;

  @Field()
  public aspectRatio!: number;
}
