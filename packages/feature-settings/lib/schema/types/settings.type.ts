import { LogLevel } from "../enums/log-level.enum.ts";
import { Field, ObjectType } from "type-graphql";

@ObjectType()
export class Settings {
  @Field({ description: "The current version of the application" })
  version!: string;

  @Field({ description: "The API key for accessing the service" })
  apiKey!: string;

  @Field((_type) => LogLevel, {
    description: "The logging level for the application",
  })
  logLevel!: keyof typeof LogLevel;
}
