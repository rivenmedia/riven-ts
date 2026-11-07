import z from "zod";

export type LeafPathMap = ReadonlyMap<string, readonly string[]>;

function isDisplayGroup(schema: z.ZodType): schema is z.ZodObject {
  return schema instanceof z.ZodObject;
}

/**
 * Returns the schemas a wrapper delegates to: the inner type of wrappers such as
 * `.optional()`, `.default()`, `.readonly()` or `.catch()`, both sides of a pipe
 * (`.transform()`, `.pipe()`), and the target of `z.lazy()`.
 *
 * Pass `inputOnly` to follow only the input side of a pipe.
 */
function getWrappedSchemas(schema: z.ZodType, inputOnly = false): z.ZodType[] {
  if (schema instanceof z.ZodPipe) {
    return inputOnly
      ? [schema.in as z.ZodType]
      : [schema.in as z.ZodType, schema.out as z.ZodType];
  }

  if (schema instanceof z.ZodLazy) {
    return [schema.unwrap() as z.ZodType];
  }

  const { innerType } = schema._zod.def as { innerType?: z.ZodType };

  return innerType ? [innerType] : [];
}

/** Yields the schema and every schema it wraps, outermost first, once each. */
function* unwrapAll(
  schema: z.ZodType,
  inputOnly = false,
): Generator<z.ZodType> {
  const seen = new Set<z.ZodType>();
  const queue = [schema];

  for (let current = queue.shift(); current; current = queue.shift()) {
    if (seen.has(current)) {
      continue;
    }

    seen.add(current);

    yield current;

    queue.push(...getWrappedSchemas(current, inputOnly));
  }
}

function walkLeaves(
  schema: z.ZodObject,
  prefix: readonly string[],
  visit: (leaf: string, path: readonly string[], field: z.ZodType) => void,
) {
  for (const [key, field] of Object.entries<z.ZodType>(schema.shape)) {
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
 * Returns the leaf's schema default (from `.default()` or `.prefault()`), in input
 * shape: only the input side of a transform or pipe is searched.
 */
export function getLeafDefault(schema: z.ZodObject, leaf: string): unknown {
  for (const field of unwrapAll(getLeafSchema(schema, leaf), true)) {
    if (field instanceof z.ZodDefault || field instanceof z.ZodPrefault) {
      return field.def.defaultValue;
    }
  }

  return undefined;
}

export function isSecretLeaf(schema: z.ZodObject, leaf: string): boolean {
  return unwrapAll(getLeafSchema(schema, leaf)).some(
    (field) => field.meta()?.secret === true,
  );
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
