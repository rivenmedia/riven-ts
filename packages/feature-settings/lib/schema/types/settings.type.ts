import { Field, ObjectType } from "type-graphql";

import { LogLevel } from "../enums/log-level.enum.ts";

@ObjectType()
export class RivenSettings {
  @Field(() => String, {
    description: "The current version of the application",
  })
  public version!: string;

  @Field(() => String, { description: "The API key for accessing the service" })
  public apiKey!: string;

  @Field(() => LogLevel, {
    description: "The logging level for the application",
  })
  public logLevel: keyof typeof LogLevel = "SILLY";
}
