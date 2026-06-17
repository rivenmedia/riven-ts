import { JSONResolver } from "graphql-scalars";
import { Field, InputType } from "type-graphql";

import type { Setting } from "../../../../database/entities/settings.entity.ts";

@InputType()
class SettingInput implements Setting {
  @Field(() => String)
  key!: string;

  @Field(() => JSONResolver, { nullable: true })
  value!: unknown;

  @Field(() => String)
  namespace!: string;
}

@InputType()
export class UpdateSettingsInput {
  @Field(() => [SettingInput])
  settings!: SettingInput[];
}
