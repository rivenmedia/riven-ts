import { Field, ObjectType } from "type-graphql";

import { LogLevel } from "../enums/log-level.enum.ts";

@ObjectType()
export class RivenSettings {
  @Field(() => String, {
    description: "The current version of the application",
  })
  version!: string;

  @Field(() => String, { description: "The API key for accessing the service" })
  apiKey!: string;

  @Field(() => LogLevel, {
    description: "The logging level for the application",
  })
  logLevel: keyof typeof LogLevel = "SILLY";
}
