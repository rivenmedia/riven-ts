import { Field, Int, ObjectType } from "type-graphql";

/** One reason a submitted rule was rejected, addressed to a node in the tree. */
@ObjectType()
export class LibrarySectionRuleIssue {
  @Field(() => String, {
    description: 'Path to the offending node, e.g. "rules.0.value".',
  })
  public path!: string;

  @Field(() => String)
  public message!: string;

  @Field(() => String)
  public code!: string;
}

/**
 * The result of a dry-run rule validation.
 *
 * Returned instead of throwing so a rule editor can show inline errors while
 * the user is still typing, without attempting a write.
 */
@ObjectType()
export class LibrarySectionRuleValidation {
  @Field(() => Boolean)
  public valid!: boolean;

  @Field(() => [LibrarySectionRuleIssue])
  public issues!: LibrarySectionRuleIssue[];

  @Field(() => Int, {
    nullable: true,
    description: "Nesting depth, when valid.",
  })
  public depth?: number | undefined;

  @Field(() => Int, { nullable: true, description: "Node count, when valid." })
  public nodes?: number | undefined;
}

/** A filterable field, described well enough to build a rule editor from. */
@ObjectType()
export class LibrarySectionFieldInfo {
  @Field(() => String)
  public name!: string;

  @Field(() => String, {
    description:
      "Value shape: string, stringArray, number, date or boolean. Determines which operators apply.",
  })
  public kind!: string;

  @Field(() => [String])
  public operators!: string[];

  @Field(() => [String], {
    nullable: true,
    description: "Known values, for autocomplete. Not enforced.",
  })
  public values?: string[] | undefined;

  @Field(() => [String], {
    nullable: true,
    description:
      "Media types this field is populated for. A rule using it outside these is valid but will never match.",
  })
  public appliesTo?: string[] | undefined;

  @Field(() => String)
  public description!: string;
}
