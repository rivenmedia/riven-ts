import { Field, InputType } from "type-graphql";

@InputType()
export class RegisterUserInput {
  @Field()
  email!: string;

  @Field()
  password!: string;

  @Field()
  username!: string;

  @Field()
  image?: string;
}
