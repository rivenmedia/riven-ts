import { decodeEnvValue } from "./decode-env-value.ts";
import {
  getLeafPaths,
  getLeafSchema,
  unflattenSettings,
} from "./leaf-paths.ts";

import type { z } from "zod";

export interface SettingsIssue {
  path: string;
  message: string;
}

export interface ResolvedSettings<T extends z.ZodObject> {
  value: z.output<T>;
  lockedLeaves: ReadonlySet<string>;
  ignoredStored: SettingsIssue[];
}

interface LeafIssue {
  leaf: string | undefined;
  issue: SettingsIssue;
}

function toLeafIssues(schema: z.ZodObject, error: z.ZodError): LeafIssue[] {
  const leaves = getLeafPaths(schema);

  return error.issues.map((issue) => {
    const leaf = issue.path.find(
      (segment): segment is string =>
        typeof segment === "string" && leaves.has(segment),
    );

    return {
      leaf,
      issue: {
        path: issue.path.map(String).join("."),
        message: issue.message,
      },
    };
  });
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
    : toLeafIssues(schema, result.error).map(({ issue }) => issue);
}

/**
 * Merges env > stored > schema default. Invalid stored leaves are dropped
 * (and reported); invalid env values or missing required leaves throw.
 */
export function resolveSettings<T extends z.ZodObject>(input: {
  schema: T;
  stored: Record<string, unknown>;
  env: Record<string, string>;
}): ResolvedSettings<T> {
  const { schema, stored, env } = input;
  const leaves = getLeafPaths(schema);

  const decodedEnv: Record<string, unknown> = {};

  for (const [leaf, raw] of Object.entries(env)) {
    if (leaves.has(leaf)) {
      decodedEnv[leaf] = decodeEnvValue(raw, getLeafSchema(schema, leaf));
    }
  }

  const merged: Record<string, unknown> = { ...stored, ...decodedEnv };
  const ignoredStored: SettingsIssue[] = [];

  for (;;) {
    const result = schema.safeParse(unflattenSettings(schema, merged));

    if (result.success) {
      return {
        value: result.data,
        lockedLeaves: new Set(Object.keys(decodedEnv)),
        ignoredStored,
      };
    }

    let dropped = false;

    for (const { leaf, issue } of toLeafIssues(schema, result.error)) {
      if (
        leaf !== undefined &&
        leaf in stored &&
        !(leaf in decodedEnv) &&
        leaf in merged
      ) {
        // oxlint-disable-next-line typescript/no-dynamic-delete
        delete merged[leaf];
        ignoredStored.push(issue);
        dropped = true;
      }
    }

    if (!dropped) {
      throw result.error;
    }
  }
}
