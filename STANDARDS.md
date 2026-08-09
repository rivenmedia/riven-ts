# Coding Standards

This document describes the coding conventions enforced in this repository.
It is derived from the project's static analysis configuration — **Oxlint**
(linting/conventions), **Oxfmt** (formatting/style), **TypeScript**
(type-safety), and **Knip** (dead code) — plus the commit and file-naming
conventions already used throughout the codebase.

These tools are the source of truth. If this document and a config file
disagree, the config file wins — update this document to match.

## Tooling overview

| Concern                 | Tool                     | Config                                                                                                                          |
| ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Formatting              | [Oxfmt](https://oxc.rs)  | [`.oxfmtrc.json`](.oxfmtrc.json)                                                                                                |
| Linting / conventions   | [Oxlint](https://oxc.rs) | [`oxlint.config.ts`](oxlint.config.ts), shared base in [`packages/core/util-oxlint-config`](packages/core/util-oxlint-config)   |
| Types                   | TypeScript (strictest)   | [`tsconfig.json`](tsconfig.json), shared base in [`packages/core/util-typescript-config`](packages/core/util-typescript-config) |
| Dead code / unused deps | [Knip](https://knip.dev) | [`knip.config.ts`](knip.config.ts)                                                                                              |
| Commit messages         | commitlint               | [`commitlint.config.ts`](commitlint.config.ts)                                                                                  |
| Pre-commit              | husky + lint-staged      | [`lint-staged.config.mjs`](lint-staged.config.mjs)                                                                              |

Common commands (run from the repo root, via `turbo`/`pnpm`):

```bash
pnpm lint             # oxlint
pnpm lint:fix          # oxlint --fix
pnpm format:check      # oxfmt --check
pnpm format:fix        # oxfmt --write
pnpm knip              # unused files/exports/dependencies
turbo test --continue  # vitest across the workspace
```

Oxlint runs with `typeAware: true` and `typeCheck: true`, so it also catches
type-level issues (e.g. unsafe `any` usage), not just syntactic ones.

## Formatting (Oxfmt)

Formatting is fully automated — never hand-format code, run `pnpm format:fix`
(or rely on the `lint-staged`/husky pre-commit hook).

- **Semicolons**: always (`semi: true`).
- **Quotes**: double quotes for strings (`singleQuote: false`).
- **Print width**: 80 columns.
- **Indentation**: 2 spaces, LF line endings, UTF-8, final newline, trailing
  whitespace trimmed (see [`.editorconfig`](.editorconfig)). Markdown is
  exempt from trailing-whitespace trimming (hard line breaks).
- **JSON files** (`*.json`, `*.jsonc`, `*.json5`): no trailing commas.
- **Import sorting** is automatic and grouped in this order:
  1. Internal aliases (`~/`, `@/`, `@repo/`, `#`)
  2. Built-in/external packages (`node:fs`, `react`, etc. — combined group)
  3. Subpath imports
  4. Relative imports (parent/sibling/index — combined group)
  5. Style imports (`*.css`)
  6. Unknown
  7. Type-only imports (`import type { ... }`) — always last

  Side-effect imports are **not** sorted alongside the rest
  (`sortSideEffects: false`), so their relative order is preserved.

Don't fight the formatter or hand-tune whitespace/quote style — if something
looks wrong, it's a config change, not a manual edit.

## TypeScript

The base config (`@repo/core-util-typescript-config/base.json`) extends
`@tsconfig/recommended`, `@tsconfig/node24`, `@tsconfig/node-ts`, and
**`@tsconfig/strictest`** — i.e. all strict compiler flags are on
(`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, etc.).

- `experimentalDecorators` and `emitDecoratorMetadata` are enabled (used by
  MikroORM entities and NestJS-style DI).
- Prefer **inferred return types**. `explicit-function-return-type` and
  `explicit-module-boundary-types` are intentionally disabled — don't add
  explicit return type annotations just for the sake of it.
- `no-unsafe-*` rules (`no-unsafe-assignment`, `no-unsafe-call`,
  `no-unsafe-member-access`, `no-unsafe-return`, `no-unsafe-type-assertion`)
  are enabled at the root of the repo but turned **off** inside `apps/**`
  and `packages/**` — be stricter about `any`/unsafe access at the repo
  tooling level, more pragmatic inside application/package code.
- `no-unnecessary-condition` is enforced, but constant loop conditions using
  only-allowed literals (e.g. `while (true)`) are permitted.
- `prefer-optional-chain` is enforced — use `?.` over manual `&&` chains.
- `restrict-plus-operands` and `restrict-template-expressions` are strict:
  no `any`, `boolean`, nullish, `RegExp`, etc. in `+` or template
  expressions without an explicit `String(...)`/coercion.
- `return-await` is enforced for error-handling correctness (`await` inside
  `try`/`catch` so errors are caught at the right frame).
- `no-extraneous-class` is denied unless the class carries a decorator
  (DI/entity classes are exempt).
- Type-only imports/exports should use `import type { ... }` — enforced via
  `no-duplicate-imports` (with `allowSeparateTypeImports: true`) and sorted
  last by Oxfmt.

## Linting conventions (Oxlint)

All rule categories are set to error: `correctness`, `suspicious`,
`pedantic`, `perf`, `style`, and `restriction`. Plugins in use: `typescript`,
`import`, `unicorn`, `node`, `oxc`, `react` (JSX only), `vitest` (tests
only), plus `@eslint/json` and `eslint-plugin-turbo`.

### Imports

- **No default exports** (`import/no-default-export`) — always use named
  exports. Config files (`*.config.ts`) are the one exception, since many
  tools require a default export there.
- **No unassigned/side-effect imports**, except `reflect-metadata`, `*.css`,
  and `*.d.ts`.
- **No import cycles** deeper than 3 modules (`import/no-cycle`, `maxDepth:
3`).
- Namespace imports (`import * as foo`) are disallowed generally, but
  allowed in test files where mocking often needs them.

### General style

- `eqeqeq`: `smart` — use `===`/`!==`, except where `==` against `null` is
  idiomatic (`no-eq-null` explicitly allows `== null`/`!= null` as a
  combined null/undefined check).
- **Function style**: prefer function declarations; arrow functions are
  also allowed (`func-style: declaration, allowArrowFunctions: true`).
  Arrow functions assigned to `const` are the dominant style seen in this
  codebase.
- **Single-character identifiers** are only allowed for: `a`/`b` (sort
  callbacks), `i` (loop counters), `z` (the `zod` import), and `_`
  (intentionally-unused). All other identifiers must be meaningful
  (`id-length`).
- Unused variables/args must be prefixed with `_`
  (`no-unused-vars: argsIgnorePattern: "^_"`); unused rest siblings from
  destructuring are allowed.
- `console` usage is an error except `console.debug` — use the project
  `logger` utility instead of `console.log`/`warn`/`error`.
- Prefer Luxon's `DateTime` over the built-in `Date` constructor
  (`no-restricted-globals`) — except in test files and `*.entity.ts` files,
  where MikroORM needs the native `Date` constructor for runtime type
  reflection.
- Only import from `@mikro-orm/core` (and `reflection`, `decorators`,
  `seeder`, `migrations`) — not other `@mikro-orm/*` subpackages
  (`no-restricted-imports`).
- `no-plusplus` is denied except in for-loop afterthoughts (`i++` in
  `for (...; ...; i++)` is fine; standalone `i++` is not).
- `no-underscore-dangle` is a warning, except for `__typename` (GraphQL).
- `no-console`, `no-negated-condition`, `capitalized-comments`,
  `sort-keys`, and `sort-imports` are intentionally off/delegated
  elsewhere (formatting handles import sorting; the above rules produced
  too much noise or false positives to be worth enabling).
- `complexity`, `max-classes-per-file`, `max-depth`, `max-lines`,
  `max-lines-per-function`, `max-params`, and `max-statements` are
  currently disabled repo-wide — flagged in config as "will be enabled in
  the future", so don't rely on their absence as tacit approval for very
  large functions/files.

### Unicorn

- Nested ternaries are allowed (formatting removes the wrapping
  parentheses unicorn would otherwise suggest).
- `no-null` is off — `null` is used freely alongside `undefined`.
- `consistent-function-scoping` is off in test files (helper functions
  nested inside `it`/`describe` blocks are fine there).

### React / JSX (where applicable)

- JSX may only appear in `.tsx` files (`react/jsx-filename-extension`).
- `react/react-in-jsx-scope` is off (React 17+ automatic JSX runtime).
- A number of stylistic React rules (`jsx-curly-brace-presence`,
  `jsx-max-depth`, `jsx-no-literals`, `no-multi-comp`,
  `only-export-components`, etc.) are currently off — same "future work"
  caveat as above.

### Node

- `node/no-process-env` is allowed — reading `process.env` directly is
  fine (env access is centralized through settings modules in practice).
- `node/no-sync` (no synchronous fs/etc. calls) is relaxed in test files.

### Tests (Vitest)

- Use `it`, not `test` (`vitest/consistent-test-it: { fn: "it" }`).
- Test files should be named `*.spec.ts` (`vitest/consistent-test-filename`
  is a warning if not).
- `vitest/prefer-expect-assertions` is denied for callback/loop-based
  `expect` usage — i.e. functions that call `expect` inside a callback or
  loop should declare `expect.assertions(n)`.
- Flat test files (no top-level `describe`) are the preferred style; split
  into separate files instead of nesting more `describe` blocks for
  organization.
- `typescript/no-unsafe-argument`, `no-unsafe-return`, and
  `no-unsafe-assignment` are relaxed in tests, since mocking helpers
  (`expect.objectContaining()`, mocked return values, etc.) commonly
  produce `any`.

## Naming conventions

File names are kebab-case with a suffix that identifies the file's role,
matching how Knip's project patterns and the lint overrides target files:

- `*.entity.ts` — MikroORM entities
- `*.schema.ts` — Zod schemas
- `*.actor.ts` — XState actors
- `*.spec.ts` — Vitest test files
- `*.config.ts` — tool configuration (default exports allowed here)
- `*-settings.schema.ts` — settings schemas (drive generated docs — see
  Knip section)

## Dead code and dependencies (Knip)

Knip checks for unused files, exports, and dependencies per workspace
(root, `apps/wiki`, `apps/riven`, `packages/*`, `packages/core/*`). Notable
points:

- Generated code (`**/__generated__/**`), config files, and `*.setup.ts`
  files are treated as entry points, not dead code.
- A file/export tagged `@lintignore`-excluded via the `-lintignore` tag
  filter is skipped — use sparingly, and only when a genuine false
  positive can't be resolved another way.
- Each workspace has its own `entry`/`project`/`ignoreDependencies` rules
  (e.g. `apps/riven` ignores `Migration*.ts` and `factories`/`seeders`
  directories from dead-code analysis, since those are invoked
  dynamically).
- Run `pnpm knip` locally before relying on CI to catch unused
  exports/dependencies — `knip:prepare` regenerates API schemas first so
  generated-code consumers aren't false-flagged.

## Commits

Commit messages follow [Conventional Commits]
(https://www.conventionalcommits.org/), enforced by commitlint
(`@commitlint/config-conventional`). The commit `scope` must be one of a
generated enum: `repo`, `deps`, `ci`, every directory under `apps/`, and
every directory under `packages/` (with `plugin-`/`util-`/`feature-`
prefixes stripped, and `packages/core/*` subdirectories included too).

Example: `fix(seerr): handle empty response body` (scope derived from
`packages/plugin-seerr` → `seerr`).
