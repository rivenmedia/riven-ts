import { LIBRARY_SECTION_FIELDS } from "@repo/util-plugin-sdk/schemas/library-section/index";

import { DateTime } from "luxon";

import { normaliseText } from "./normalise.ts";

import type { ItemFacts, StreamFacts } from "./item-facts.ts";
import type {
  FieldOfKind,
  LibrarySectionCondition,
  LibrarySectionFieldKind,
  LibrarySectionRule,
} from "@repo/util-plugin-sdk/schemas/library-section/index";

const MILLISECONDS_PER_DAY = 86_400_000;

const STREAM_FIELD_PREFIX = "stream.";

/**
 * The conditions naming a field of the given kind.
 *
 * The per-kind field sets are disjoint, so this narrows each evaluator to
 * exactly the operators and value types its schema branch permits — which is
 * what keeps the switches below exhaustive and free of value casts.
 */
type ConditionOfKind<Kind extends LibrarySectionFieldKind> = Extract<
  LibrarySectionCondition,
  { field: FieldOfKind<Kind> }
>;

const readField = (
  field: LibrarySectionCondition["field"],
  facts: ItemFacts,
) => {
  if (field.startsWith(STREAM_FIELD_PREFIX)) {
    const key = field.slice(STREAM_FIELD_PREFIX.length) as keyof StreamFacts;

    return facts.stream?.[key] ?? null;
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
  condition: ConditionOfKind<"string">,
): boolean => {
  if (actual === null) {
    return condition.op === "neq" || condition.op === "nin";
  }

  switch (condition.op) {
    case "eq": {
      return actual === normaliseText(condition.value);
    }
    case "neq": {
      return actual !== normaliseText(condition.value);
    }
    case "in": {
      return condition.value.some((item) => normaliseText(item) === actual);
    }
    case "nin": {
      return !condition.value.some((item) => normaliseText(item) === actual);
    }
    case "contains": {
      return actual.includes(normaliseText(condition.value) ?? "");
    }
    case "startsWith": {
      return actual.startsWith(normaliseText(condition.value) ?? "");
    }
    case "endsWith": {
      return actual.endsWith(normaliseText(condition.value) ?? "");
    }
  }
};

const evaluateStringArray = (
  actual: string[] | null,
  condition: ConditionOfKind<"stringArray">,
): boolean => {
  const values = actual ?? [];
  const has = (candidate: string) =>
    values.includes(normaliseText(candidate) ?? "");

  switch (condition.op) {
    case "includes": {
      return has(condition.value);
    }
    case "excludes": {
      return !has(condition.value);
    }
    case "includesAll": {
      return condition.value.every((item) => has(item));
    }
    case "includesAny": {
      return condition.value.some((item) => has(item));
    }
    case "isEmpty": {
      return (values.length === 0) === condition.value;
    }
  }
};

const evaluateNumber = (
  actual: number | null,
  condition: ConditionOfKind<"number">,
): boolean => {
  if (actual === null) {
    return condition.op === "neq";
  }

  switch (condition.op) {
    case "eq": {
      return actual === condition.value;
    }
    case "neq": {
      return actual !== condition.value;
    }
    case "gt": {
      return actual > condition.value;
    }
    case "gte": {
      return actual >= condition.value;
    }
    case "lt": {
      return actual < condition.value;
    }
    case "lte": {
      return actual <= condition.value;
    }
    case "between": {
      const [minimum, maximum] = condition.value;

      return actual >= minimum && actual <= maximum;
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
  condition: ConditionOfKind<"date">,
  now: number,
): boolean => {
  if (actual === null) {
    return false;
  }

  switch (condition.op) {
    case "before": {
      return actual < toEpoch(condition.value);
    }
    case "after": {
      return actual > toEpoch(condition.value);
    }
    case "between": {
      const [from, to] = condition.value;

      return actual >= toEpoch(from) && actual <= toEpoch(to);
    }
    case "inLastDays": {
      return actual >= now - condition.value * MILLISECONDS_PER_DAY;
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
        condition as ConditionOfKind<"string">,
      );
    }
    case "stringArray": {
      return evaluateStringArray(
        actual as string[] | null,
        condition as ConditionOfKind<"stringArray">,
      );
    }
    case "number": {
      return evaluateNumber(
        actual as number | null,
        condition as ConditionOfKind<"number">,
      );
    }
    case "date": {
      return evaluateDate(
        actual as number | null,
        condition as ConditionOfKind<"date">,
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
 * Pure and synchronous: no I/O, no entity access, and the clock is injected.
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
