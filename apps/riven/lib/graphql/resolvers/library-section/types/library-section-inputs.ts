import { LIBRARY_SECTION_SLUG_PATTERN } from "@repo/util-plugin-sdk/dto/entities";
import { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";

import {
  ArrayNotEmpty,
  IsOptional,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";
import { Field, ID, InputType, Int } from "type-graphql";

import type { LibrarySectionMediaType } from "@repo/util-plugin-sdk/dto/entities";
import type { UUID } from "node:crypto";

const RULE_DESCRIPTION =
  "Recursive rule tree deciding membership. Null matches everything of the section's media types. Validate it with `validateLibrarySectionRule`, and fetch its shape with `librarySectionRuleSchema` and `librarySectionFields`.";

/**
 * The rule is a JSON scalar rather than a typed input.
 *
 * GraphQL has no input unions, and type-graphql cannot express a
 * self-referencing input type, so a recursive rule tree is not representable in
 * the schema. It is validated with Zod in the resolver instead, and the three
 * introspection queries give the frontend a machine-readable contract.
 */
@InputType()
export class CreateLibrarySectionInput {
  @Field(() => String)
  @MinLength(1)
  @MaxLength(120)
  public name!: string;

  @Field(() => String, {
    nullable: true,
    description: "Directory name. Derived from the display name when omitted.",
  })
  @IsOptional()
  @Matches(LIBRARY_SECTION_SLUG_PATTERN)
  public slug?: string;

  @Field(() => [MediaItemType.enum])
  @ArrayNotEmpty()
  public mediaTypes!: LibrarySectionMediaType[];

  @Field(() => Boolean, {
    defaultValue: true,
    description:
      "Nest contents under movies/ and shows/. Ignored for a section holding a single media type.",
  })
  public split!: boolean;

  @Field(() => Object, { nullable: true, description: RULE_DESCRIPTION })
  public rule?: unknown;

  @Field(() => Boolean, { defaultValue: true })
  public enabled!: boolean;

  @Field(() => Int, { defaultValue: 0 })
  public sortOrder!: number;
}

@InputType()
export class UpdateLibrarySectionInput {
  @Field(() => ID)
  public id!: UUID;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @MinLength(1)
  @MaxLength(120)
  public name?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @Matches(LIBRARY_SECTION_SLUG_PATTERN)
  public slug?: string;

  @Field(() => [MediaItemType.enum], { nullable: true })
  @IsOptional()
  @ArrayNotEmpty()
  public mediaTypes?: LibrarySectionMediaType[];

  @Field(() => Boolean, { nullable: true })
  public split?: boolean;

  @Field(() => Object, { nullable: true, description: RULE_DESCRIPTION })
  public rule?: unknown;

  @Field(() => Boolean, { nullable: true })
  public enabled?: boolean;

  @Field(() => Int, { nullable: true })
  public sortOrder?: number;
}
