import packageJson from "./package.json" with { type: "json" };

export const workspaceImports = Object.keys({
  ...packageJson.devDependencies,
  ...packageJson.dependencies,
}).filter((dep) => dep.startsWith("@repo/"));
