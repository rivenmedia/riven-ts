import { Field, InputType } from "type-graphql";

@InputType()
export class LoginUserInput {
  @Field()
  username!: string;

  @Field()
  password!: string;
}
