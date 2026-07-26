import { LIBRARY_SECTION_FIELDS } from "@repo/util-plugin-sdk/schemas/library-section/index";

import { DateTime } from "luxon";

import { normaliseText } from "./normalise.ts";

import type { ItemFacts, StreamFacts } from "./item-facts.ts";
import type {
  LibrarySectionCondition,
  LibrarySectionRule,
} from "@repo/util-plugin-sdk/schemas/library-section/index";

const MILLISECONDS_PER_DAY = 86_400_000;

type FactValue = string | string[] | number | boolean | null;

const STREAM_FIELD_PREFIX = "stream.";

const readField = (
  field: LibrarySectionCondition["field"],
  facts: ItemFacts,
): FactValue => {
  if (field.startsWith(STREAM_FIELD_PREFIX)) {
    if (!facts.stream) {
      return null;
    }

    const key = field.slice(STREAM_FIELD_PREFIX.length) as keyof StreamFacts;

    return facts.stream[key];
  }

  return facts[field as Exclude<typeof field, `stream.${string}`>];
};

/**
 * A missing value never satisfies a positive predicate and always satisfies its
 * negation. Under a `not` node this inverts, so `not(genres includes "horror")`
 * matches items that have no genres at all — surprising, but the only
 * composable choice, and asserted in the spec.
 */
const evaluateString = (
  actual: string | null,
  op: string,
  value: string | string[],
): boolean => {
  if (actual === null) {
    return op === "neq" || op === "nin";
  }

  switch (op) {
    case "eq": {
      return actual === normaliseText(value as string);
    }
    case "neq": {
      return actual !== normaliseText(value as string);
    }
    case "in": {
      return (value as string[]).some((item) => normaliseText(item) === actual);
    }
    case "nin": {
      return !(value as string[]).some(
        (item) => normaliseText(item) === actual,
      );
    }
    case "contains": {
      return actual.includes(normaliseText(value as string) ?? "");
    }
    case "startsWith": {
      return actual.startsWith(normaliseText(value as string) ?? "");
    }
    case "endsWith": {
      return actual.endsWith(normaliseText(value as string) ?? "");
    }
    default: {
      return false;
    }
  }
};

const evaluateStringArray = (
  actual: string[] | null,
  op: string,
  value: string | string[] | boolean,
): boolean => {
  const values = actual ?? [];
  const has = (candidate: string) =>
    values.includes(normaliseText(candidate) ?? "");

  switch (op) {
    case "includes": {
      return has(value as string);
    }
    case "excludes": {
      return !has(value as string);
    }
    case "includesAll": {
      return (value as string[]).every((item) => has(item));
    }
    case "includesAny": {
      return (value as string[]).some((item) => has(item));
    }
    case "isEmpty": {
      return (values.length === 0) === (value as boolean);
    }
    default: {
      return false;
    }
  }
};

const evaluateNumber = (
  actual: number | null,
  op: string,
  value: number | [number, number],
): boolean => {
  if (actual === null) {
    return op === "neq";
  }

  switch (op) {
    case "eq": {
      return actual === value;
    }
    case "neq": {
      return actual !== value;
    }
    case "gt": {
      return actual > (value as number);
    }
    case "gte": {
      return actual >= (value as number);
    }
    case "lt": {
      return actual < (value as number);
    }
    case "lte": {
      return actual <= (value as number);
    }
    case "between": {
      const [minimum, maximum] = value as [number, number];

      return actual >= minimum && actual <= maximum;
    }
    default: {
      return false;
    }
  }
};

/**
 * Operands are validated as ISO strings by the rule schema. An unparseable one
 * yields NaN, and every comparison against NaN is false, which is the safe
 * outcome for a malformed rule.
 */
const toEpoch = (value: string) =>
  DateTime.fromISO(value, { zone: "utc" }).toMillis();

const evaluateDate = (
  actual: number | null,
  op: string,
  value: string | [string, string] | number,
  now: number,
): boolean => {
  if (actual === null) {
    return false;
  }

  switch (op) {
    case "before": {
      return actual < toEpoch(value as string);
    }
    case "after": {
      return actual > toEpoch(value as string);
    }
    case "between": {
      const [from, to] = value as [string, string];

      return actual >= toEpoch(from) && actual <= toEpoch(to);
    }
    case "inLastDays": {
      return actual >= now - (value as number) * MILLISECONDS_PER_DAY;
    }
    default: {
      return false;
    }
  }
};

const evaluateCondition = (
  condition: LibrarySectionCondition,
  facts: ItemFacts,
  now: number,
): boolean => {
  const { kind } = LIBRARY_SECTION_FIELDS[condition.field];
  const actual = readField(condition.field, facts);

  switch (kind) {
    case "string": {
      return evaluateString(
        actual as string | null,
        condition.op,
        condition.value as string | string[],
      );
    }
    case "stringArray": {
      return evaluateStringArray(
        actual as string[] | null,
        condition.op,
        condition.value as string | string[] | boolean,
      );
    }
    case "number": {
      return evaluateNumber(
        actual as number | null,
        condition.op,
        condition.value as number | [number, number],
      );
    }
    case "date": {
      return evaluateDate(
        actual as number | null,
        condition.op,
        condition.value as string | [string, string] | number,
        now,
      );
    }
    case "boolean": {
      return actual === condition.value;
    }
  }
};

/**
 * Evaluates a library section rule tree against a pre-built facts object.
 *
 * PURE AND SYNCHRONOUS BY CONTRACT. No I/O, no entity access, and no reading
 * the clock — `now` is injected. This is the seam that lets section membership
 * be materialised into a join table later without touching any rule semantics:
 * a materialiser is just this function in a loop over persisted facts.
 *
 * @param rule The tree to evaluate. `null` matches everything.
 * @param now Epoch milliseconds, used by the `inLastDays` operator.
 */
export const evaluateRule = (
  rule: LibrarySectionRule | null | undefined,
  facts: ItemFacts,
  now: number,
): boolean => {
  if (!rule) {
    return true;
  }

  switch (rule.type) {
    case "and": {
      return rule.rules.every((child) => evaluateRule(child, facts, now));
    }
    case "or": {
      return rule.rules.some((child) => evaluateRule(child, facts, now));
    }
    case "not": {
      return !evaluateRule(rule.rule, facts, now);
    }
    case "condition": {
      return evaluateCondition(rule, facts, now);
    }
  }
};
