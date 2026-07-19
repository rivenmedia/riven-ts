export const tsFiles = "**/*.{ts,tsx,mts,mtsx,cts,ctsx}";

export const jsFiles = "**/*.{js,jsx,mjs,cjs,mjsx,cjsx}";

export const jsxFiles = "**/*.{tsx,jsx,mtsx,mjsx,ctsx,cjsx}";

export const testFiles = [
  "**/*.spec.{ts,tsx,mts,mtsx,cts,ctsx}",
  "**/*test-context.ts",
] as const;

export const entityFiles = "**/*.entity.ts";

export const jsonFiles = "**/*.{json,jsonc,json5}";

export const configFiles =
  "**/*.config.{ts,tsx,mts,mtsx,cts,ctsx,js,jsx,mjs,cjs,mjsx,cjsx}";
