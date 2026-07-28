import { LibrarySection } from "@repo/util-plugin-sdk/dto/entities";
import { LibrarySectionOverrideMode } from "@repo/util-plugin-sdk/dto/enums/library-section-override-mode.enum";
import {
  LIBRARY_SECTION_FIELDS,
  LibrarySectionRuleRoot,
  measureRule,
  OPERATORS_BY_KIND,
} from "@repo/util-plugin-sdk/schemas/library-section/index";

import { GraphQLError } from "graphql";
import { JSONObjectResolver } from "graphql-scalars";
import { Arg, ID, Mutation, Query, Resolver } from "type-graphql";
import z from "zod";

import { LibrarySectionError } from "../../../database/services/library-section/library-section.service.ts";
import { CoreContext } from "../../decorators/core-context.ts";
import {
  CreateLibrarySectionInput,
  UpdateLibrarySectionInput,
} from "./types/library-section-inputs.ts";
import {
  LibrarySectionFieldInfo,
  LibrarySectionRuleValidation,
} from "./types/library-section-types.ts";

import type { LibrarySectionRule } from "@repo/util-plugin-sdk/schemas/library-section/index";
import type { UUID } from "node:crypto";

/**
 * Validates a rule submitted as a JSON scalar.
 *
 * @throws {GraphQLError} with the Zod issues attached, so a client that skipped
 * `validateLibrarySectionRule` still gets an actionable error.
 */
function parseRule(rule: unknown): LibrarySectionRule | null {
  if (rule === null || rule === undefined) {
    return null;
  }

  const parsed = LibrarySectionRuleRoot.safeParse(rule);

  if (!parsed.success) {
    throw new GraphQLError(
      `Invalid library section rule: ${z.prettifyError(parsed.error)}`,
      { extensions: { code: "BAD_USER_INPUT", issues: parsed.error.issues } },
    );
  }

  return parsed.data;
}

/** Surfaces service-level rejections as user errors rather than server faults. */
async function withUserErrors<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof LibrarySectionError) {
      throw new GraphQLError(error.message, {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    throw error;
  }
}

const RULE_JSON_SCHEMA = z.toJSONSchema(LibrarySectionRuleRoot, {
  io: "input",
});

const FIELD_INFO: LibrarySectionFieldInfo[] = Object.entries(
  LIBRARY_SECTION_FIELDS,
).map(([name, definition]) => ({
  name,
  kind: definition.kind,
  operators: [...OPERATORS_BY_KIND[definition.kind]],
  values: "values" in definition ? [...definition.values] : undefined,
  appliesTo: "appliesTo" in definition ? [...definition.appliesTo] : undefined,
  description: definition.description,
}));

@Resolver(() => LibrarySection)
export class LibrarySectionResolver {
  @Query(() => [LibrarySection], {
    description:
      "All library sections, ordered as they appear in the filesystem root.",
  })
  public async librarySections(
    @CoreContext() { services }: CoreContext,
    @Arg("enabledOnly", () => Boolean, { defaultValue: false })
    enabledOnly: boolean,
  ): Promise<LibrarySection[]> {
    return services.librarySectionService.findAll({ enabledOnly });
  }

  @Query(() => LibrarySection, { nullable: true })
  public async librarySection(
    @CoreContext() { services }: CoreContext,
    @Arg("id", () => ID) id: UUID,
  ): Promise<LibrarySection | null> {
    return services.librarySectionService.findById(id);
  }

  @Query(() => [LibrarySectionFieldInfo], {
    description:
      "Every field a rule can filter on, with its operators and known values. Lets a rule editor be built without hardcoding the field set.",
  })
  public librarySectionFields(): LibrarySectionFieldInfo[] {
    return FIELD_INFO;
  }

  @Query(() => JSONObjectResolver, {
    description:
      "JSON Schema for the rule tree, for clients that prefer to validate locally.",
  })
  public librarySectionRuleSchema(): Record<string, unknown> {
    return RULE_JSON_SCHEMA;
  }

  @Query(() => LibrarySectionRuleValidation, {
    description:
      "Checks a rule without saving it, returning structured issues rather than throwing.",
  })
  public validateLibrarySectionRule(
    @Arg("rule", () => JSONObjectResolver) rule: unknown,
  ): LibrarySectionRuleValidation {
    const parsed = LibrarySectionRuleRoot.safeParse(rule);

    if (!parsed.success) {
      return {
        valid: false,
        issues: parsed.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
          code: issue.code,
        })),
      };
    }

    const { depth, nodes } = measureRule(parsed.data);

    return { valid: true, issues: [], depth, nodes };
  }

  @Mutation(() => LibrarySection)
  public async createLibrarySection(
    @CoreContext() { services }: CoreContext,
    @Arg("input", () => CreateLibrarySectionInput)
    input: CreateLibrarySectionInput,
  ): Promise<LibrarySection> {
    const { rule, ...rest } = input;

    return withUserErrors(async () =>
      services.librarySectionService.create({ ...rest, rule: parseRule(rule) }),
    );
  }

  @Mutation(() => LibrarySection)
  public async updateLibrarySection(
    @CoreContext() { services }: CoreContext,
    @Arg("input", () => UpdateLibrarySectionInput)
    input: UpdateLibrarySectionInput,
  ): Promise<LibrarySection> {
    const { id, rule, ...rest } = input;

    // `rule` is spread only when supplied, which is what distinguishes "not
    // supplied" from "explicitly cleared".
    return withUserErrors(async () =>
      services.librarySectionService.update(id, {
        ...rest,
        ...(rule !== undefined && { rule: parseRule(rule) }),
      }),
    );
  }

  @Mutation(() => Boolean)
  public async deleteLibrarySection(
    @CoreContext() { services }: CoreContext,
    @Arg("id", () => ID) id: UUID,
  ): Promise<boolean> {
    return services.librarySectionService.delete(id);
  }

  @Mutation(() => [LibrarySection], {
    description:
      "Sets each section's sort order from its position in the list.",
  })
  public async reorderLibrarySections(
    @CoreContext() { services }: CoreContext,
    @Arg("ids", () => [ID]) ids: UUID[],
  ): Promise<LibrarySection[]> {
    return services.librarySectionService.reorder(ids);
  }

  @Mutation(() => LibrarySection, {
    description:
      "Forces a media item into or out of a section, overriding its rule.",
  })
  public async setLibrarySectionOverride(
    @CoreContext() { services }: CoreContext,
    @Arg("sectionId", () => ID) sectionId: UUID,
    @Arg("mediaItemId", () => ID) mediaItemId: UUID,
    @Arg("mode", () => LibrarySectionOverrideMode.enum)
    mode: LibrarySectionOverrideMode,
  ): Promise<LibrarySection> {
    return services.librarySectionService.setOverride(
      sectionId,
      mediaItemId,
      mode,
    );
  }

  @Mutation(() => LibrarySection, {
    description: "Restores rule-driven membership for a media item.",
  })
  public async clearLibrarySectionOverride(
    @CoreContext() { services }: CoreContext,
    @Arg("sectionId", () => ID) sectionId: UUID,
    @Arg("mediaItemId", () => ID) mediaItemId: UUID,
  ): Promise<LibrarySection> {
    return services.librarySectionService.clearOverride(sectionId, mediaItemId);
  }
}
