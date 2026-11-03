import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { buildSettingsConfigFromZodSchema } from "../build-settings-config-from-zod-schema.ts";

import type { SettingFieldProps } from "#components/settings/setting-field/setting-field.tsx";

/*
 * The fixtures are the JSON Schemas the backend serves for General and each
 * core plugin, on a default install (no secrets set). Regenerate them from the
 * repo root after a settings schema changes, with Node's type stripping:
 *
 *   node --input-type=module-typescript -e '
 *     import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
 *     const r = process.cwd(), out = "apps/frontend/components/settings/_utilities/__tests__/__fixtures__/served-section-schemas";
 *     const { buildSectionJsonSchema } = await import(`${r}/apps/riven/lib/settings/build-section-json-schema.ts`);
 *     const { GeneralSettings } = await import(`${r}/apps/riven/lib/settings/sections/general-settings.schema.ts`);
 *     const sections = [["general", GeneralSettings]];
 *     for (const dir of readdirSync("packages").filter((d) => d.startsWith("plugin-") && d !== "plugin-test")) {
 *       const file = readdirSync(`packages/${dir}/lib`).find((f) => f.endsWith("-settings.schema.ts"));
 *       sections.push([dir.replace("plugin-", ""), Object.values(await import(`${r}/packages/${dir}/lib/${file}`))[0]]);
 *     }
 *     mkdirSync(out, { recursive: true });
 *     for (const [name, schema] of sections) writeFileSync(`${out}/${name}.json`, `${JSON.stringify(buildSectionJsonSchema(schema, new Map()), null, 2)}\n`);
 *   ' && pnpm exec oxfmt apps/frontend/components/settings/_utilities/__tests__/__fixtures__
 */
const fixturesDirectory = path.join(
  import.meta.dirname,
  "__fixtures__/served-section-schemas",
);

/**
 * Served leaves the builder knowingly renders nothing for, keyed by section.
 */
const knownSkippedLeaves: Record<string, string[]> = {
  // An array of template literal unions (Apprise-style URLs), which has no
  // input yet
  notifications: ["urls"],
};

interface JsonSchemaNode {
  type?: unknown;
  properties?: Record<string, JsonSchemaNode>;
}

/** The dotted path of every served leaf, descending into nested objects. */
function getServedLeaves(node: JsonSchemaNode, prefix = ""): string[] {
  return Object.entries(node.properties ?? {}).flatMap(([key, child]) => {
    const name = prefix ? `${prefix}.${key}` : key;

    return child.type === "object" && child.properties
      ? getServedLeaves(child, name)
      : [name];
  });
}

/** The name of every built field, without the groups around them. */
function getBuiltLeaves(fields: Iterable<SettingFieldProps>): string[] {
  return [...fields].flatMap((field) =>
    field.type === "group"
      ? getBuiltLeaves(field.config.schema)
      : [field.config.name],
  );
}

const sections = readdirSync(fixturesDirectory)
  .filter((file) => file.endsWith(".json"))
  .map((file) => {
    const jsonSchema = JSON.parse(
      readFileSync(path.join(fixturesDirectory, file), "utf8"),
    ) as Record<string, unknown>;

    return [path.basename(file, ".json"), jsonSchema] as const;
  });

describe("served section schemas", () => {
  it("has a fixture for General and the core plugins", () => {
    expect(sections.map(([name]) => name)).toContain("general");
    expect(sections.length).toBeGreaterThan(1);
  });

  it.each(sections)(
    "renders every %s leaf or knowingly skips it",
    (name, jsonSchema) => {
      const schema = z.fromJSONSchema(jsonSchema);
      const fields = buildSettingsConfigFromZodSchema(schema).values();

      const builtLeaves = getBuiltLeaves(fields);
      const skippedLeaves = knownSkippedLeaves[name] ?? [];

      expect(builtLeaves).toStrictEqual(
        getServedLeaves(jsonSchema).filter(
          (leaf) => !skippedLeaves.includes(leaf),
        ),
      );
    },
  );
});
