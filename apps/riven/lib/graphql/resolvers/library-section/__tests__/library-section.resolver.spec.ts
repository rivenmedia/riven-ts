import { describe, expect } from "vitest";

import { it } from "../../../../__tests__/test-context.ts";
import { LibrarySectionResolver } from "../library-section.resolver.ts";

import type { CoreContext } from "../../../decorators/core-context.ts";

const resolver = new LibrarySectionResolver();

const horrorRule = {
  type: "condition",
  field: "genres",
  op: "includesAny",
  value: ["horror"],
};

describe("rule introspection", () => {
  it("describes every filterable field with its operators", () => {
    const fields = resolver.librarySectionFields();
    const genres = fields.find((field) => field.name === "genres");

    expect(genres).toMatchObject({
      kind: "stringArray",
      operators: expect.arrayContaining(["includes", "includesAny"]),
    });
  });

  it("flags fields that only apply to one media type", () => {
    const network = resolver
      .librarySectionFields()
      .find((field) => field.name === "network");

    expect(network?.appliesTo).toStrictEqual(["show"]);
  });

  it("omits fields that can never discriminate", () => {
    // `rating` is hardcoded to 0 for movies and null for shows.
    expect(
      resolver.librarySectionFields().map((field) => field.name),
    ).not.toContain("rating");
  });

  it("publishes a JSON schema for the rule tree", () => {
    expect(resolver.librarySectionRuleSchema()).toHaveProperty("$schema");
  });
});

describe("rule validation", () => {
  it("accepts a well-formed rule and reports its shape", () => {
    expect(resolver.validateLibrarySectionRule(horrorRule)).toStrictEqual({
      valid: true,
      issues: [],
      depth: 1,
      nodes: 1,
    });
  });

  it("reports issues without throwing so an editor can show them inline", () => {
    const result = resolver.validateLibrarySectionRule({
      type: "condition",
      field: "year",
      op: "contains",
      value: "nope",
    });

    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });

  it("measures a nested tree", () => {
    expect(
      resolver.validateLibrarySectionRule({
        type: "and",
        rules: [horrorRule, { type: "not", rule: horrorRule }],
      }),
    ).toMatchObject({ valid: true, depth: 3, nodes: 4 });
  });
});

describe("mutations", () => {
  it("creates a section through the API", async ({ services, em }) => {
    const context = { em, services } as CoreContext;

    const section = await resolver.createLibrarySection(context, {
      name: "Horror",
      mediaTypes: ["movie", "show"],
      split: true,
      enabled: true,
      sortOrder: 0,
      rule: horrorRule,
    });

    expect(section).toMatchObject({ slug: "horror", enabled: true });
  });

  it("rejects an invalid rule with a user error rather than persisting it", async ({
    services,
    em,
  }) => {
    const context = { em, services } as CoreContext;

    await expect(
      resolver.createLibrarySection(context, {
        name: "Broken",
        mediaTypes: ["movie"],
        split: true,
        enabled: true,
        sortOrder: 0,
        rule: { type: "condition", field: "year", op: "contains", value: "x" },
      }),
    ).rejects.toThrow(/Invalid library section rule/u);

    await expect(
      resolver.librarySections(context, false),
    ).resolves.toStrictEqual([]);
  });

  it("rejects a reserved directory name with a user error", async ({
    services,
    em,
  }) => {
    const context = { em, services } as CoreContext;

    await expect(
      resolver.createLibrarySection(context, {
        name: "Movies",
        mediaTypes: ["movie"],
        split: true,
        enabled: true,
        sortOrder: 0,
      }),
    ).rejects.toThrow(/reserved/u);
  });

  it("leaves the rule untouched when an update omits it", async ({
    services,
    em,
  }) => {
    const context = { em, services } as CoreContext;

    const created = await resolver.createLibrarySection(context, {
      name: "Horror",
      mediaTypes: ["movie"],
      split: true,
      enabled: true,
      sortOrder: 0,
      rule: horrorRule,
    });

    const updated = await resolver.updateLibrarySection(context, {
      id: created.id,
      name: "Scary",
    });

    expect(updated.rule).toStrictEqual(horrorRule);
  });

  it("clears the rule when an update passes null", async ({ services, em }) => {
    const context = { em, services } as CoreContext;

    const created = await resolver.createLibrarySection(context, {
      name: "Horror",
      mediaTypes: ["movie"],
      split: true,
      enabled: true,
      sortOrder: 0,
      rule: horrorRule,
    });

    const updated = await resolver.updateLibrarySection(context, {
      id: created.id,
      rule: null,
    });

    expect(updated.rule).toBeNull();
  });

  it("deletes a section", async ({ services, em }) => {
    const context = { em, services } as CoreContext;

    const created = await resolver.createLibrarySection(context, {
      name: "Horror",
      mediaTypes: ["movie"],
      split: true,
      enabled: true,
      sortOrder: 0,
    });

    await expect(
      resolver.deleteLibrarySection(context, created.id),
    ).resolves.toBe(true);
    await expect(
      resolver.librarySections(context, false),
    ).resolves.toStrictEqual([]);
  });
});
