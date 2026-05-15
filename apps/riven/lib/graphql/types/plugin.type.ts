import { JSONObjectResolver } from "graphql-scalars";
import { Field, Float, ObjectType } from "type-graphql";

@ObjectType({
  description:
    "The most recent error a plugin reported. Present when `Plugin.status` is `invalid` (or any future failure state) and the registry retained the failure cause.",
})
export class PluginLastError {
  @Field(() => String)
  message!: string;

  // Float (not Int) because we surface a unix-ms timestamp; Int would overflow
  // GraphQL's 32-bit signed bound. Matches the dashboard's `number` typing.
  @Field(() => Float, {
    description: "Unix epoch milliseconds.",
  })
  timestamp!: number;
}

@ObjectType({
  description:
    "A registered Riven plugin as seen by the runtime registry. Sourced from the live `RegisteredPluginMap`, not from disk.",
})
export class Plugin {
  @Field(() => String, {
    description:
      "Human-readable identifier derived from `RivenPlugin.name.description`. May fall back to a stringified symbol if the description is missing.",
  })
  name!: string;

  @Field(() => String)
  version!: string;

  @Field(() => String, {
    description:
      "Registry-reported status discriminator (e.g. `registered`, `valid`, `invalid`). The dashboard treats unknown values as opaque strings.",
  })
  status!: string;

  @Field(() => PluginLastError, { nullable: true })
  lastError!: PluginLastError | null;

  @Field(() => [String], {
    description:
      "Event types this plugin hooks. Derived from `RivenPlugin.hooks` keys; empty when the plugin registers no event handlers.",
  })
  capabilities!: string[];

  // The registry doesn't expose hydrated settings here — `RivenPlugin.config`
  // only carries the Zod schema, not user-applied values. Surfaced as nullable
  // JSON so the dashboard can render a placeholder until the settings service
  // is wired through.
  @Field(() => JSONObjectResolver, { nullable: true })
  settings!: Record<string, unknown> | null;
}
