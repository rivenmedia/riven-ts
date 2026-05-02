import { LogLevel } from "@rivenmedia/plugin-sdk/graphql/enums/log-level.enum";

import { Field, ObjectType } from "type-graphql";

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
