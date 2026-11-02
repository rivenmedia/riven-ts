import {
  getLeafPaths,
  isSecretLeaf,
} from "@repo/util-plugin-sdk/utilities/settings";

import z from "zod";

import type { SecretState } from "./settings-manager.ts";

interface JsonSchemaNode {
  properties?: Record<string, JsonSchemaNode>;
  required?: string[];
  anyOf?: JsonSchemaNode[];
  oneOf?: JsonSchemaNode[];
  allOf?: JsonSchemaNode[];
  [key: string]: unknown;
}

/** Removes `key` from the node and from every union/intersection member. */
function removeKeyword(node: JsonSchemaNode, key: string) {
  // oxlint-disable-next-line typescript/no-dynamic-delete
  delete node[key];

  for (const member of [
    ...(node.anyOf ?? []),
    ...(node.oneOf ?? []),
    ...(node.allOf ?? []),
  ]) {
    removeKeyword(member, key);
  }
}

/** Finds a leaf's JSON Schema node and the object node that declares it. */
function findLeafNode(root: JsonSchemaNode, path: readonly string[]) {
  let parent = root;

  for (const segment of path.slice(0, -1)) {
    const group = parent.properties?.[segment];

    if (!group) {
      throw new Error(`Missing JSON schema group "${segment}"`);
    }

    parent = group;
  }

  const key = path.at(-1);
  const node = key === undefined ? undefined : parent.properties?.[key];

  if (key === undefined || !node) {
    throw new Error(`Missing JSON schema node "${path.join(".")}"`);
  }

  return { parent, key, node };
}

function removeRequired(parent: JsonSchemaNode, key: string) {
  const required = parent.required?.filter((name) => name !== key) ?? [];

  if (required.length > 0) {
    parent.required = required;
  } else {
    delete parent.required;
  }
}

/**
 * Builds the JSON Schema served to the frontend for a settings section.
 *
 * Secret defaults are removed so they never leave the backend, and secrets that
 * already have a value (`default`, `custom` or `env`) are made optional so an
 * empty submission means "unchanged".
 */
export function buildSectionJsonSchema(
  schema: z.ZodObject,
  secretStates: Map<string, SecretState>,
): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(schema, {
    io: "input",
    unrepresentable: "any",
  }) as JsonSchemaNode;

  for (const [leaf, path] of getLeafPaths(schema)) {
    if (!isSecretLeaf(schema, leaf)) {
      continue;
    }

    const { parent, key, node } = findLeafNode(jsonSchema, path);

    removeKeyword(node, "default");

    if ((secretStates.get(leaf) ?? "unset") !== "unset") {
      removeKeyword(node, "minLength");
      removeRequired(parent, key);
    }
  }

  return jsonSchema;
}
