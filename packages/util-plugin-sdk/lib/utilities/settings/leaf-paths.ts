import z from "zod";

export type LeafPathMap = ReadonlyMap<string, readonly string[]>;

function isDisplayGroup(schema: z.ZodType): schema is z.ZodObject {
  return schema instanceof z.ZodObject;
}

function unwrapOnce(schema: z.ZodType): z.ZodType | undefined {
  if (
    schema instanceof z.ZodDefault ||
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodNullable
  ) {
    return schema.unwrap() as z.ZodType;
  }

  return undefined;
}

function walkLeaves(
  schema: z.ZodObject,
  prefix: readonly string[],
  visit: (leaf: string, path: readonly string[], field: z.ZodType) => void,
) {
  for (const [key, field] of Object.entries(schema.shape) as [
    string,
    z.ZodType,
  ][]) {
    if (isDisplayGroup(field)) {
      walkLeaves(field, [...prefix, key], visit);
    } else {
      visit(key, [...prefix, key], field);
    }
  }
}

/**
 * Maps every leaf key of a (grouped) settings schema to its nested path.
 *
 * @throws if two leaves share the same key.
 */
export function getLeafPaths(schema: z.ZodObject): LeafPathMap {
  const paths = new Map<string, readonly string[]>();

  walkLeaves(schema, [], (leaf, path) => {
    if (paths.has(leaf)) {
      throw new Error(`Duplicate settings key "${leaf}"`);
    }

    paths.set(leaf, path);
  });

  return paths;
}

function collectGroupPaths(
  schema: z.ZodObject,
  prefix: readonly string[],
  out: (readonly string[])[],
) {
  for (const [key, field] of Object.entries(schema.shape) as [
    string,
    z.ZodType,
  ][]) {
    if (isDisplayGroup(field)) {
      const path = [...prefix, key];

      out.push(path);
      collectGroupPaths(field, path, out);
    }
  }
}

export function getLeafSchema(schema: z.ZodObject, leaf: string): z.ZodType {
  let found = null as z.ZodType | null;

  walkLeaves(schema, [], (key, _path, field) => {
    if (key === leaf) {
      found = field;
    }
  });

  if (found === null) {
    throw new Error(`Unknown settings key "${leaf}"`);
  }

  return found;
}

/**
 * Returns the leaf's schema default, in input shape (a transform's input side is used).
 */
export function getLeafDefault(schema: z.ZodObject, leaf: string): unknown {
  let field = getLeafSchema(schema, leaf);

  while (field instanceof z.ZodPipe) {
    field = field.in as z.ZodType;
  }

  return field instanceof z.ZodDefault ? field.def.defaultValue : undefined;
}

export function isSecretLeaf(schema: z.ZodObject, leaf: string): boolean {
  let current: z.ZodType | undefined = getLeafSchema(schema, leaf);

  while (current) {
    if (current.meta()?.secret) {
      return true;
    }

    current = unwrapOnce(current);
  }

  return false;
}

/**
 * Converts nested settings into a flat `leaf -> value` record.
 */
export function flattenSettings(
  schema: z.ZodObject,
  nested: Record<string, unknown>,
): Record<string, unknown> {
  const flat: Record<string, unknown> = {};

  for (const [leaf, path] of getLeafPaths(schema)) {
    let cursor: unknown = nested;

    for (const segment of path) {
      if (
        typeof cursor !== "object" ||
        cursor === null ||
        !(segment in cursor)
      ) {
        cursor = undefined;
        break;
      }

      cursor = (cursor as Record<string, unknown>)[segment];
    }

    if (cursor !== undefined) {
      flat[leaf] = cursor;
    }
  }

  return flat;
}

/**
 * Converts a flat `leaf -> value` record into the nested shape of the schema.
 * Every display group is materialised so nested defaults apply. Unknown keys are dropped.
 */
export function unflattenSettings(
  schema: z.ZodObject,
  flat: Record<string, unknown>,
): Record<string, unknown> {
  const nested: Record<string, unknown> = {};

  const ensure = (path: readonly string[]) => {
    let cursor = nested;

    for (const segment of path) {
      cursor[segment] ??= {};
      cursor = cursor[segment] as Record<string, unknown>;
    }

    return cursor;
  };

  const groups: (readonly string[])[] = [];

  collectGroupPaths(schema, [], groups);

  for (const group of groups) {
    ensure(group);
  }

  for (const [leaf, path] of getLeafPaths(schema)) {
    const key = path.at(-1);

    if (leaf in flat && key !== undefined) {
      ensure(path.slice(0, -1))[key] = flat[leaf];
    }
  }

  return nested;
}
