import z from "zod";

import { fieldsOfKind } from "./library-section-field.registry.ts";

/**
 * Bounds on the rule tree. The blob is user-editable through the GraphQL API,
 * so it is untrusted input and the evaluator recurses over it.
 */
export const MAX_RULE_DEPTH = 8;
export const MAX_RULE_NODES = 200;

const MAX_STRING_LENGTH = 200;
const MAX_LIST_LENGTH = 100;
const MAX_CHILDREN = 50;

const operand = z.string().min(1).max(MAX_STRING_LENGTH);
const operandList = z.array(operand).min(1).max(MAX_LIST_LENGTH);
// Jsonb has no date type, so dates round-trip as ISO strings.
const dateOperand = z.union([z.iso.datetime({ offset: true }), z.iso.date()]);

const conditionType = z.literal("condition");

const StringCondition = z.discriminatedUnion("op", [
  z.object({
    type: conditionType,
    field: z.enum(fieldsOfKind("string")),
    op: z.enum(["eq", "neq", "contains", "startsWith", "endsWith"]),
    value: operand,
  }),
  z.object({
    type: conditionType,
    field: z.enum(fieldsOfKind("string")),
    op: z.enum(["in", "nin"]),
    value: operandList,
  }),
]);

const StringArrayCondition = z.discriminatedUnion("op", [
  z.object({
    type: conditionType,
    field: z.enum(fieldsOfKind("stringArray")),
    op: z.enum(["includes", "excludes"]),
    value: operand,
  }),
  z.object({
    type: conditionType,
    field: z.enum(fieldsOfKind("stringArray")),
    op: z.enum(["includesAll", "includesAny"]),
    value: operandList,
  }),
  z.object({
    type: conditionType,
    field: z.enum(fieldsOfKind("stringArray")),
    op: z.literal("isEmpty"),
    value: z.boolean(),
  }),
]);

const NumberCondition = z.discriminatedUnion("op", [
  z.object({
    type: conditionType,
    field: z.enum(fieldsOfKind("number")),
    op: z.enum(["eq", "neq", "gt", "gte", "lt", "lte"]),
    value: z.number(),
  }),
  z.object({
    type: conditionType,
    field: z.enum(fieldsOfKind("number")),
    op: z.literal("between"),
    value: z.tuple([z.number(), z.number()]),
  }),
]);

const DateCondition = z.discriminatedUnion("op", [
  z.object({
    type: conditionType,
    field: z.enum(fieldsOfKind("date")),
    op: z.enum(["before", "after"]),
    value: dateOperand,
  }),
  z.object({
    type: conditionType,
    field: z.enum(fieldsOfKind("date")),
    op: z.literal("between"),
    value: z.tuple([dateOperand, dateOperand]),
  }),
  z.object({
    type: conditionType,
    field: z.enum(fieldsOfKind("date")),
    op: z.literal("inLastDays"),
    // 100 years, well beyond any sane library.
    value: z.int().positive().max(36_500),
  }),
]);

const BooleanCondition = z.object({
  type: conditionType,
  field: z.enum(fieldsOfKind("boolean")),
  op: z.literal("is"),
  value: z.boolean(),
});

export const LibrarySectionCondition = z.union([
  StringCondition,
  StringArrayCondition,
  NumberCondition,
  DateCondition,
  BooleanCondition,
]);

export type LibrarySectionCondition = z.infer<typeof LibrarySectionCondition>;

export type LibrarySectionRule =
  | { type: "and"; rules: LibrarySectionRule[] }
  | { type: "or"; rules: LibrarySectionRule[] }
  | { type: "not"; rule: LibrarySectionRule }
  | LibrarySectionCondition;

const AndNode = z.object({
  type: z.literal("and"),
  get rules() {
    return z.array(LibrarySectionRule).min(1).max(MAX_CHILDREN);
  },
});

const OrNode = z.object({
  type: z.literal("or"),
  get rules() {
    return z.array(LibrarySectionRule).min(1).max(MAX_CHILDREN);
  },
});

const NotNode = z.object({
  type: z.literal("not"),
  get rule() {
    return LibrarySectionRule;
  },
});

export const LibrarySectionRule: z.ZodType<LibrarySectionRule> = z.lazy(() =>
  z.union([AndNode, OrNode, NotNode, LibrarySectionCondition]),
);

/** Depth and node count of a validated tree. */
export const measureRule = (
  rule: LibrarySectionRule,
): { depth: number; nodes: number } => {
  switch (rule.type) {
    case "and":
    case "or": {
      const children = rule.rules.map(measureRule);

      return {
        depth: 1 + Math.max(...children.map((child) => child.depth)),
        nodes: 1 + children.reduce((total, child) => total + child.nodes, 0),
      };
    }
    case "not": {
      const child = measureRule(rule.rule);

      return { depth: 1 + child.depth, nodes: 1 + child.nodes };
    }
    case "condition": {
      return { depth: 1, nodes: 1 };
    }
  }
};

/**
 * The entry point for validating a stored or submitted rule.
 *
 * Wraps the recursive schema with the depth and node bounds, which the schema
 * itself cannot express.
 */
export const LibrarySectionRuleRoot = LibrarySectionRule.check((ctx) => {
  const { depth, nodes } = measureRule(ctx.value);

  if (depth > MAX_RULE_DEPTH) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `Rule tree is nested too deeply (${depth.toString()} levels, maximum ${MAX_RULE_DEPTH.toString()})`,
    });
  }

  if (nodes > MAX_RULE_NODES) {
    ctx.issues.push({
      code: "custom",
      input: ctx.value,
      message: `Rule tree has too many nodes (${nodes.toString()}, maximum ${MAX_RULE_NODES.toString()})`,
    });
  }
});
