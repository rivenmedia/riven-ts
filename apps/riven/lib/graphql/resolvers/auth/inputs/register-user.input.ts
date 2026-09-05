import { Field, InputType } from "type-graphql";

@InputType()
export class RegisterUserInput {
  @Field()
  public email!: string;

  @Field()
  public password!: string;

  @Field()
  public username!: string;

  @Field()
  public image?: string;
}
