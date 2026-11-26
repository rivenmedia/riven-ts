import sonarjs from "eslint-plugin-sonarjs";
import { createRequire } from "node:module";

type Visitor = Record<string, ((...args: unknown[]) => unknown) | undefined>;

interface RuleModule {
  create: (context: unknown) => Visitor;
}

/**
 * `eslint-plugin-sonarjs` caches each file's imports keyed on the identity of ESLint's `sourceCode`
 * object. Oxlint reuses that object between files, so the first file's imports stick for the whole
 * run and rules that depend on them (e.g. recognising `expect(...)` from `vitest`) silently stop
 * reporting.
 *
 * This re-exports the plugin with every rule clearing those caches when it starts a new file.
 */
const require = createRequire(import.meta.url);

const { clearFileCaches } =
  require("eslint-plugin-sonarjs/cjs/helpers/module.js") as {
    clearFileCaches: () => void;
  };

const withFreshCache = (rule: RuleModule): RuleModule => ({
  ...rule,
  create: (context) => {
    const visitor = rule.create(context);
    const onProgram = visitor["Program"];

    return {
      ...visitor,
      Program: (...args) => {
        clearFileCaches();

        return onProgram?.(...args);
      },
    };
  },
});

const rules = Object.fromEntries(
  Object.entries(sonarjs.rules).map(([name, rule]) => [
    name,
    withFreshCache(rule as unknown as RuleModule),
  ]),
);

// Oxlint only needs the plugin's meta and rules, and spreading the rest would leak ESLint's config
// types into this module's declarations
const plugin: { meta: typeof sonarjs.meta; rules: Record<string, RuleModule> } =
  {
    meta: sonarjs.meta,
    rules,
  };

// oxlint-disable-next-line import/no-default-export -- Oxlint JS plugins are loaded from the module's default export
export default plugin;
