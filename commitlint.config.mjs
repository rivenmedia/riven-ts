import { readdirSync } from "node:fs";

function getScopes() {
  const prefixes = ["plugin-", "util-", "feature-"];
  const scopes = ["repo"];

  // Get scopes from apps directory
  const apps = readdirSync("apps");
  scopes.push(...apps);

  // Get scopes from packages directory
  const packages = readdirSync("packages");
  for (const pkg of packages) {
    let scope = pkg;
    for (const prefix of prefixes) {
      if (scope.startsWith(prefix)) {
        scope = scope.slice(prefix.length);
        break;
      }
    }
    scopes.push(scope);
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
