import {
  decodeEnvValue,
  flattenSettings,
  getLeafDefault,
  getLeafPaths,
  getLeafSchema,
  isSecretLeaf,
  resolveSettings,
  unflattenSettings,
  validateSettings,
} from "@repo/util-plugin-sdk/utilities/settings";

import { isEqual } from "es-toolkit";
import { GraphQLError } from "graphql";
import z from "zod";

import { buildSectionJsonSchema } from "./build-section-json-schema.ts";
import {
  CORE_NAMESPACE,
  coreSettingsSections,
} from "./core-settings-sections.ts";

import type { SettingsService } from "#database/services/settings/settings.service.ts";
import type { InstalledPlugin } from "#types/plugins.ts";
import type {
  LeafPathMap,
  SettingsIssue,
} from "@repo/util-plugin-sdk/utilities/settings";

export type SecretState = "default" | "custom" | "env" | "unset";

export interface SettingsSectionDefinition {
  id: string;
  /** The settings owner: `riven` or the plugin package name. */
  namespace: string;
  title: string;
  schema: z.ZodObject;
  /** Raw env values keyed by leaf. Never exposed outside the settings manager. */
  environment: Readonly<Record<string, string>>;
}

export interface SettingsSectionView {
  id: string;
  title: string;
  jsonSchema: Record<string, unknown>;
  /** Nested input shape: stored ∪ env ∪ defaults, with secrets omitted. */
  values: Record<string, unknown>;
  /** Dotted paths of env-set fields. */
  lockedFields: string[];
  secretStates: { path: string; state: SecretState }[];
  /** Stored values that are currently being ignored. */
  issues: SettingsIssue[];
}

export interface PluginSummary {
  /** The plugin's settings section id. */
  id: string;
  title: string;
  enabled: boolean;
  alwaysEnabled: boolean;
}

export interface SettingsManagerDeps {
  settingsService: SettingsService;
  sections: ReadonlyMap<string, SettingsSectionDefinition>;
  installedPlugins: InstalledPlugin[];
  coreEnvironment: Readonly<Record<string, string>>;
}

interface SectionState {
  definition: SettingsSectionDefinition;
  leaves: LeafPathMap;
  /** Stored values for the section's leaves. */
  stored: Record<string, unknown>;
  /** Decoded env values for the section's leaves. */
  env: Record<string, unknown>;
}

function notFound(message: string) {
  return new GraphQLError(message, { extensions: { code: "NOT_FOUND" } });
}

function pickLeaves<T>(
  leaves: LeafPathMap,
  values: Readonly<Record<string, T>>,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(values).filter(([key]) => leaves.has(key)),
  );
}

function decodeEnvironment(
  schema: z.ZodObject,
  leaves: LeafPathMap,
  environment: Readonly<Record<string, string>>,
) {
  return Object.fromEntries(
    Object.entries(pickLeaves(leaves, environment)).map(([leaf, raw]) => [
      leaf,
      decodeEnvValue(raw, getLeafSchema(schema, leaf)),
    ]),
  );
}

function toDottedPath(leaves: LeafPathMap, leaf: string) {
  return leaves.get(leaf)?.join(".") ?? leaf;
}

function getSecretState(
  leaf: string,
  stored: Record<string, unknown>,
  env: Record<string, unknown>,
  defaultValue: unknown,
): SecretState {
  if (leaf in env) {
    return "env";
  }

  if (leaf in stored) {
    return "custom";
  }

  return defaultValue === undefined ? "unset" : "default";
}

function findIssueLeaf(leaves: LeafPathMap, issue: SettingsIssue) {
  return issue.path.split(".").find((segment) => leaves.has(segment));
}

/**
 * The settings domain layer: section views, saving, resetting and enabling plugins.
 *
 * Env values are held privately and never returned; views only expose which
 * fields are locked and the state of each secret.
 */
export class SettingsManager {
  readonly #settingsService: SettingsService;
  readonly #sections: ReadonlyMap<string, SettingsSectionDefinition>;
  readonly #installedPlugins: InstalledPlugin[];
  readonly #coreEnvironment: Readonly<Record<string, string>>;
  #restartRequired = false;

  public constructor(deps: SettingsManagerDeps) {
    this.#settingsService = deps.settingsService;
    this.#sections = deps.sections;
    this.#installedPlugins = deps.installedPlugins;
    this.#coreEnvironment = deps.coreEnvironment;
  }

  /** Whether any settings have changed since boot. */
  public get restartRequired() {
    return this.#restartRequired;
  }

  public async getSection(id: string): Promise<SettingsSectionView> {
    const { definition, leaves, stored, env } = await this.#loadSection(id);
    const { schema } = definition;

    const issues = this.#findIgnoredStored(definition, stored, env, leaves);
    const ignoredLeaves = new Set(
      issues.map((issue) => findIssueLeaf(leaves, issue)),
    );
    const effectiveStored = Object.fromEntries(
      Object.entries(stored).filter(([leaf]) => !ignoredLeaves.has(leaf)),
    );

    const flatValues: Record<string, unknown> = {};
    const secretStates = new Map<string, SecretState>();

    for (const leaf of leaves.keys()) {
      const defaultValue = getLeafDefault(schema, leaf);

      if (isSecretLeaf(schema, leaf)) {
        secretStates.set(
          leaf,
          getSecretState(leaf, effectiveStored, env, defaultValue),
        );
      } else if (leaf in env) {
        flatValues[leaf] = env[leaf];
      } else if (leaf in stored) {
        flatValues[leaf] = stored[leaf];
      } else if (defaultValue !== undefined) {
        flatValues[leaf] = defaultValue;
      }
    }

    return {
      id: definition.id,
      title: definition.title,
      jsonSchema: buildSectionJsonSchema(schema, secretStates),
      values: unflattenSettings(schema, flatValues),
      lockedFields: Object.keys(env).map((leaf) => toDottedPath(leaves, leaf)),
      secretStates: secretStates
        .entries()
        .map(([leaf, state]) => ({ path: toDottedPath(leaves, leaf), state }))
        .toArray(),
      issues,
    };
  }

  public async updateSection(
    id: string,
    values: Record<string, unknown>,
  ): Promise<SettingsIssue[]> {
    const { definition, stored, env } = await this.#loadSection(id);
    const { schema } = definition;

    const submitted = Object.fromEntries(
      Object.entries(flattenSettings(schema, values)).filter(
        ([leaf, value]) =>
          !(leaf in env) &&
          !(
            isSecretLeaf(schema, leaf) &&
            (value === "" || value === undefined)
          ),
      ),
    );

    const issues = validateSettings(schema, {
      ...stored,
      ...submitted,
      ...env,
    });

    if (issues.length > 0) {
      return issues;
    }

    const upsert: Record<string, unknown> = {};
    const toDelete: string[] = [];

    for (const [leaf, value] of Object.entries(submitted)) {
      if (isEqual(value, getLeafDefault(schema, leaf))) {
        if (leaf in stored) {
          toDelete.push(leaf);
        }
      } else if (!(leaf in stored) || !isEqual(value, stored[leaf])) {
        upsert[leaf] = value;
      }
    }

    await this.#write(definition.namespace, upsert, toDelete);

    return [];
  }

  public async resetFields(
    id: string,
    paths: string[],
  ): Promise<SettingsIssue[]> {
    const { definition, leaves, stored, env } = await this.#loadSection(id);

    const leafByPath = new Map(
      leaves.entries().map(([leaf, path]) => [path.join("."), leaf]),
    );
    const resetLeaves = new Set<string>();
    const unknownPaths: SettingsIssue[] = [];

    for (const path of paths) {
      const leaf = leafByPath.get(path);

      if (leaf === undefined) {
        unknownPaths.push({ path, message: `Unknown setting "${path}"` });
      } else {
        resetLeaves.add(leaf);
      }
    }

    if (unknownPaths.length > 0) {
      return unknownPaths;
    }

    const remaining = Object.fromEntries(
      Object.entries(stored).filter(([leaf]) => !resetLeaves.has(leaf)),
    );

    const issues = validateSettings(definition.schema, {
      ...remaining,
      ...env,
    });

    if (issues.length > 0) {
      return issues;
    }

    await this.#write(
      definition.namespace,
      {},
      [...resetLeaves].filter((leaf) => leaf in stored),
    );

    return [];
  }

  public async setPluginEnabled(
    id: string,
    enabled: boolean,
  ): Promise<SettingsIssue[]> {
    const plugin = this.#installedPlugins.find(
      ({ sectionId }) => sectionId === id,
    );

    if (!plugin) {
      throw notFound(`Unknown plugin "${id}"`);
    }

    if (plugin.alwaysEnabled) {
      return [
        {
          path: "enabled",
          message: `Plugin "${plugin.packageName}" is always enabled.`,
        },
      ];
    }

    const { enabledPlugins, locked, stored } = await this.#loadEnabledPlugins();

    if (locked) {
      return [
        {
          path: "enabled",
          message: "Enabled plugins are set by an environment variable.",
        },
      ];
    }

    const next = enabled
      ? [...new Set([...enabledPlugins, plugin.name])]
      : enabledPlugins.filter((name) => name !== plugin.name);

    if (isEqual(new Set(next), new Set(enabledPlugins))) {
      return [];
    }

    if (enabled) {
      const {
        definition,
        stored: pluginStored,
        env,
      } = await this.#loadSection(id);

      const issues = validateSettings(definition.schema, {
        ...pluginStored,
        ...env,
      });

      if (issues.length > 0) {
        return issues;
      }
    }

    const schema = coreSettingsSections.plugins;
    const isDefault = isEqual(next, getLeafDefault(schema, "enabledPlugins"));

    if (isDefault && !("enabledPlugins" in stored)) {
      return [];
    }

    await this.#write(
      CORE_NAMESPACE,
      isDefault ? {} : { enabledPlugins: next },
      isDefault ? ["enabledPlugins"] : [],
    );

    return [];
  }

  public async listPlugins(): Promise<{
    plugins: PluginSummary[];
    enabledPluginsLocked: boolean;
  }> {
    const { enabledPlugins, locked } = await this.#loadEnabledPlugins();

    return {
      plugins: this.#installedPlugins.map(
        ({ sectionId, packageName, name, alwaysEnabled }) => ({
          id: sectionId,
          title: this.#sections.get(sectionId)?.title ?? packageName,
          enabled: alwaysEnabled || enabledPlugins.includes(name),
          alwaysEnabled,
        }),
      ),
      enabledPluginsLocked: locked,
    };
  }

  async #loadSection(id: string): Promise<SectionState> {
    const definition = this.#sections.get(id);

    if (!definition) {
      throw notFound(`Unknown settings section "${id}"`);
    }

    const leaves = getLeafPaths(definition.schema);
    const stored = await this.#settingsService.getStoredValues(
      definition.namespace,
    );

    return {
      definition,
      leaves,
      stored: pickLeaves(leaves, stored),
      env: decodeEnvironment(definition.schema, leaves, definition.environment),
    };
  }

  /** The currently configured enabled plugins (stored + env), not the boot-time set. */
  async #loadEnabledPlugins() {
    const schema = coreSettingsSections.plugins;
    const stored = pickLeaves(
      getLeafPaths(schema),
      await this.#settingsService.getStoredValues(CORE_NAMESPACE),
    );

    const { value, lockedLeaves } = resolveSettings({
      schema,
      stored,
      env: { ...this.#coreEnvironment },
    });

    return {
      enabledPlugins: value.enabledPlugins,
      locked: lockedLeaves.has("enabledPlugins"),
      stored,
    };
  }

  /**
   * Returns the stored values that fail validation and are therefore ignored.
   *
   * Falls back to filtering a plain validation when resolution fails for reasons
   * unrelated to stored values (e.g. a required field with no value yet).
   */
  #findIgnoredStored(
    definition: SettingsSectionDefinition,
    stored: Record<string, unknown>,
    env: Record<string, unknown>,
    leaves: LeafPathMap,
  ): SettingsIssue[] {
    try {
      return resolveSettings({
        schema: definition.schema,
        stored,
        env: pickLeaves(leaves, definition.environment),
      }).ignoredStored;
    } catch (error) {
      if (!(error instanceof z.ZodError)) {
        throw error;
      }

      return validateSettings(definition.schema, { ...stored, ...env }).filter(
        (issue) => {
          const leaf = findIssueLeaf(leaves, issue);

          return leaf !== undefined && leaf in stored && !(leaf in env);
        },
      );
    }
  }

  async #write(
    namespace: string,
    upsert: Record<string, unknown>,
    toDelete: string[],
  ) {
    if (Object.keys(upsert).length === 0 && toDelete.length === 0) {
      return;
    }

    await this.#settingsService.writeValues(namespace, {
      upsert,
      delete: toDelete,
    });

    this.#restartRequired = true;
  }
}
