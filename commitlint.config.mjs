import { readdirSync } from "node:fs";

const prefixes = ["plugin-", "util-", "feature-"];

function getDirNames(path) {
  return readdirSync(path, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function stripPrefix(name) {
  for (const prefix of prefixes) {
    if (name.startsWith(prefix)) {
      return name.slice(prefix.length);
    }
  }
  return name;
}

function getScopes() {
  const scopes = ["repo"];

  // Get scopes from apps directory
  scopes.push(...getDirNames("apps"));

  // Get scopes from packages directory
  for (const pkg of getDirNames("packages")) {
    scopes.push(stripPrefix(pkg));

    // Get scopes from packages/core/* subdirectories
    if (pkg === "core") {
      scopes.push(...getDirNames(`packages/${pkg}`).map(stripPrefix));
    }
  }

  return scopes.sort();
}

/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-enum": [2, "always", getScopes()],
  },
};
