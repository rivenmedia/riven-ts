// oxlint-disable node/no-sync

import { readdirSync } from "node:fs";

import type { UserConfig } from "@commitlint/types";

const prefixes = ["plugin-", "util-", "feature-"];

function getDirNames(path: string) {
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function stripPrefix(name: string) {
  for (const prefix of prefixes) {
    if (name.startsWith(prefix)) {
      return name.slice(prefix.length);
    }
  }

  return name;
}

function getScopes() {
  const scopes = new Set(["repo", "deps", "ci"]);

  // Get scopes from apps directory
  for (const dir of getDirNames("apps")) {
    scopes.add(dir);
  }

  // Get scopes from packages directory
  for (const directory of getDirNames("packages")) {
    scopes.add(stripPrefix(directory));

    // Get scopes from packages/core/* subdirectories
    if (directory === "core") {
      for (const subDir of getDirNames(`packages/${directory}`)) {
        scopes.add(stripPrefix(subDir));
      }
    }
  }

  return [...scopes].toSorted();
}

export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [2, "always", getScopes()],
  },
} satisfies UserConfig;
