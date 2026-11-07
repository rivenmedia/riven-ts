import { kebabCase } from "es-toolkit";

/**
 * Converts a plugin's package name into its settings section id,
 * e.g. `@repo/plugin-comet` → `repo-plugin-comet`.
 */
export function toPluginSectionId(packageName: string): string {
  return kebabCase(packageName);
}
