import { decodeEnvValue } from "./decode-env-value.ts";
import {
  getLeafPaths,
  getLeafSchema,
  unflattenSettings,
} from "./leaf-paths.ts";

import type { SettingsIssue } from "#types/__generated__/graphql.ts";
import type { LeafPathMap } from "./leaf-paths.ts";
import type { z } from "zod";

/** A stored value that failed validation and was ignored. */
export interface IgnoredStoredSetting extends SettingsIssue {
  leaf: string;
}

export interface ResolvedSettings<T extends z.ZodObject> {
  value: z.infer<T>;
  lockedLeaves: ReadonlySet<string>;
  ignoredStored: IgnoredStoredSetting[];
}

interface ResolveSettingsInput<T extends z.ZodObject> {
  schema: T;
  stored: Record<string, unknown>;
  env: Record<string, string>;
}

interface LeafIssue extends SettingsIssue {
  /** The leaf the issue is attributed to, if it can be traced to one. */
  leaf: string | undefined;
}

function toLeafIssues(schema: z.ZodObject, error: z.ZodError): LeafIssue[] {
  const leaves = getLeafPaths(schema);

  return error.issues.map((issue) => ({
    leaf: issue.path.find(
      (segment): segment is string =>
        typeof segment === "string" && leaves.has(segment),
    ),
    path: issue.path.map(String).join("."),
    message: issue.message,
  }));
}

/** The first issue of each stored leaf that the issues are attributed to. */
function findInvalidStored(
  issues: LeafIssue[],
  isStoredInPlay: (leaf: string) => boolean,
): IgnoredStoredSetting[] {
  const found = new Map<string, IgnoredStoredSetting>();

  for (const { leaf, path, message } of issues) {
    if (leaf !== undefined && isStoredInPlay(leaf) && !found.has(leaf)) {
      found.set(leaf, { leaf, path, message });
    }
  }

  return [...found.values()];
}

/**
 * Last resort when issues can't be traced to a leaf (e.g. a refinement on a
 * display group): ignores every stored leaf so env + defaults are used alone.
 */
function ignoreAllStored(
  leaves: LeafPathMap,
  unattributed: LeafIssue[],
  isStoredInPlay: (leaf: string) => boolean,
): IgnoredStoredSetting[] {
  const reason = unattributed.map(({ message }) => message).join("; ");

  return leaves
    .entries()
    .filter(([leaf]) => isStoredInPlay(leaf))
    .map(([leaf, path]) => ({
      leaf,
      path: path.join("."),
      message: `Ignored because the settings are invalid in a way that could not be traced to a single setting: ${reason}`,
    }))
    .toArray();
}

/**
 * Parses env > stored > schema default, dropping invalid stored leaves until the
 * parse succeeds or no remaining issue can be fixed by dropping stored values.
 */
function parseSettings<T extends z.ZodObject>({
  schema,
  stored,
  env,
}: ResolveSettingsInput<T>) {
  const leaves = getLeafPaths(schema);

  const decodedEnv: Record<string, unknown> = {};

  for (const [leaf, raw] of Object.entries(env)) {
    if (leaves.has(leaf)) {
      decodedEnv[leaf] = decodeEnvValue(raw, getLeafSchema(schema, leaf));
    }
  }

  const merged: Record<string, unknown> = { ...stored, ...decodedEnv };
  const ignoredStored: IgnoredStoredSetting[] = [];

  /** Whether the leaf's merged value currently comes from the stored values. */
  const isStoredInPlay = (leaf: string) =>
    leaf in stored && !(leaf in decodedEnv) && leaf in merged;

  while (true) {
    const result = schema.safeParse(unflattenSettings(schema, merged));

    if (result.success) {
      return { result, decodedEnv, ignoredStored };
    }

    const issues = toLeafIssues(schema, result.error);
    const unattributed = issues.filter(({ leaf }) => leaf === undefined);
    const invalidStored = findInvalidStored(issues, isStoredInPlay);
    const ignored =
      invalidStored.length > 0 || unattributed.length === 0
        ? invalidStored
        : ignoreAllStored(leaves, unattributed, isStoredInPlay);

    if (ignored.length === 0) {
      return { result, decodedEnv, ignoredStored };
    }

    for (const issue of ignored) {
      // oxlint-disable-next-line typescript/no-dynamic-delete
      delete merged[issue.leaf];
      ignoredStored.push(issue);
    }
  }
}

/**
 * Validates a flat settings record against the schema, returning any issues
 * with dotted nested paths.
 */
export function validateSettings(
  schema: z.ZodObject,
  flat: Record<string, unknown>,
): SettingsIssue[] {
  const result = schema.safeParse(unflattenSettings(schema, flat));

  return result.success
    ? []
    : toLeafIssues(schema, result.error).map(({ path, message }) => ({
        path,
        message,
      }));
}

/**
 * Merges env > stored > schema default. Invalid stored leaves are dropped
 * (and reported); if the issues can't be traced to a leaf, every stored leaf
 * is dropped. Invalid env values or missing required leaves throw.
 */
export function resolveSettings<T extends z.ZodObject>(
  input: ResolveSettingsInput<T>,
): ResolvedSettings<T> {
  const { result, decodedEnv, ignoredStored } = parseSettings(input);

  if (!result.success) {
    throw result.error;
  }

  return {
    value: result.data,
    lockedLeaves: new Set(Object.keys(decodedEnv)),
    ignoredStored,
  };
}

/**
 * Returns the stored values that {@link resolveSettings} ignores. Unlike
 * resolution, this never throws for invalid settings, so it also reports
 * ignored values whilst a required leaf is still missing.
 */
export function findIgnoredStored<T extends z.ZodObject>(
  input: ResolveSettingsInput<T>,
): IgnoredStoredSetting[] {
  return parseSettings(input).ignoredStored;
}
