import { Field, InputType } from "type-graphql";

@InputType()
export class LoginUserInput {
  @Field()
  public username!: string;

  @Field()
  public password!: string;
}
