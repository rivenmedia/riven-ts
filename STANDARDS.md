# Coding Standards

Conventions for this repository that tooling does not enforce, plus the
reasoning behind enforced rules where it isn't obvious.

Formatting, linting, types, and dead code are enforced by the tools below.
Run them rather than memorising their rules; their configs are the source of
truth.

## Tooling

| Concern                 | Tool                     | Config                                                                                                                          |
| ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Formatting              | [Oxfmt](https://oxc.rs)  | [`.oxfmtrc.json`](.oxfmtrc.json)                                                                                                |
| Linting / conventions   | [Oxlint](https://oxc.rs) | [`oxlint.config.ts`](oxlint.config.ts), shared base in [`packages/core/util-oxlint-config`](packages/core/util-oxlint-config)   |
| Types                   | TypeScript (strictest)   | [`tsconfig.json`](tsconfig.json), shared base in [`packages/core/util-typescript-config`](packages/core/util-typescript-config) |
| Dead code / unused deps | [Knip](https://knip.dev) | [`knip.config.ts`](knip.config.ts)                                                                                              |
| Pull request titles     | commitlint               | [`commitlint.config.ts`](commitlint.config.ts)                                                                                  |
| Pre-commit              | husky + lint-staged      | [`lint-staged.config.mjs`](lint-staged.config.mjs)                                                                              |

Common commands (run from the repo root, via `turbo`/`pnpm`):

```bash
turbo lint             # `oxlint` across the workspace
turbo lint:fix         # `oxlint --fix` across the workspace
turbo test --continue  # `vitest` across the workspace
pnpm format:check      # `oxfmt --check`
pnpm format:fix        # `oxfmt --write`
pnpm knip              # unused files/exports/dependencies (development)
pnpm knip --strict     # unused files/exports/dependencies (production)
```

Oxlint runs with `typeAware: true` and `typeCheck: true`, so it also catches
type-level issues (e.g. unsafe `any` usage), not just syntactic ones.

Formatting is fully automated — run `pnpm format:fix` (or rely on the
pre-commit hook) rather than hand-formatting. If formatter output looks
wrong, change the config, not the code.

## Code

- Use **inferred return types**. The explicit return type rules are
  intentionally disabled — don't add annotations just for the sake of it.
- The size and complexity rules (`complexity`, `max-lines`,
  `max-lines-per-function`, `max-params`, `max-statements`, etc.) are
  disabled for now and will be enabled in future. Their absence is not
  approval for very large functions or files.
- The `no-unsafe-*` rules are on at the repo root but off inside `apps/**`
  and `packages/**`: strict for repo tooling, pragmatic in application code.
- Use Luxon's `DateTime` rather than `Date`. These files are exempt:
  - `*.entity.ts`: MikroORM needs the native `Date` constructor for runtime
    type reflection.
  - GraphQL type files (`*.type.ts`, `*.resolver.ts`): TypeGraphQL needs a
    `Date` to convert to an ISO string.
  - Test files (`*.spec.ts`, `*test-context.ts`).
- Use the project `logger` rather than `console`.
- Browser checks in `apps/frontend`:
  - For components that can't render on the server, use
    [`use(browser())`](https://react.dev/reference/react-dom/browser) inside
    a `<Suspense>` boundary.
  - For plain code that runs in both environments, use
    `"window" in globalThis`, not `typeof window`. Story tests compile
    `typeof window` to `"undefined"`, so browser-only branches silently never
    run under test.

## Tests

- Write flat test files (no top-level `describe`); when specs span multiple logical domains, split into
  separate files (e.g. `rank-torrent.removing-trash.spec.ts`, `rank-torrent.keeping-trash.spec.ts`) instead of nesting `describe` blocks for organisation.
- Never share mutable values between tests. Either ensure the value is immutable, or add it to Vitest's context as a factory function to generate it per test.

### Type narrowing

When writing tests, use type narrowing by using `expect.assert()` over type assertions.

### Spec colocation

Write spec files alongside the source file under test when the spec
file only includes tests relating to that file.

When a test spans multiple logical boundaries (e.g. in an integration test),
place it in a `__tests__` directory at the closest common boundary, with a file
name that clearly explains the subject matter of the tests.

**BAD - spec has been hoisted:**

```text
/
└── lib
    ├── __tests__
    │   └── add.spec.ts
    └── add.ts
```

**GOOD - spec directly relates to the source file:**

```text
/
└── lib
    ├── add.ts
    └── add.spec.ts
```

**GOOD - spec spans multiple logical boundaries:**

```text
/
└── lib
    ├── __tests__
    │   └── order-of-operations.spec.ts
    └── operators
        ├── add.ts
        └── divide.ts
```

### Storybook tests

#### Story reuse

When writing Storybook tests, re-use existing stories instead of
creating new ones, unless none satisfy the needs of the initial test's state.

**BAD - duplicate stories are created with identical inputs:**

```ts
const Input = meta.story();

Input.test("does something", () => {
  /* test body */
});

const InputDirty = meta.story();

InputDirty.test("does something else", () => {
  /* test body */
});
```

**GOOD - tests are grouped where a common story is available:**

```ts
const Input = meta.story();

Input.test("does something", () => {
  /* test body */
});

Input.test("does something else", () => {
  /* test body */
});
```

**GOOD - tests are linked to different initial stories:**

```ts
const Input = meta.story();

Input.test("is editable", () => {
  /* test body */
});

const DisabledInput = meta.story({
  args: {
    disabled: true,
  },
});

DisabledInput.test("is not editable", () => {
  /* test body */
});
```

#### Args targeting

When writing Storybook stories, assert against args provided to the
story under test instead of a variable in a parent scope.

**BAD - test asserts a function outside the story scope:**

```ts
const onChange = fn();

const Input = meta.story({
  args: {
    onChange,
  },
});

Input.test("calls onChange", () => {
  /** trigger an onChange event */

  expect(onChange).toHaveBeenCalled();
});
```

**GOOD - test asserts a function directly from the story:**

```ts
const Input = meta.story({
  args: {
    onChange: fn(),
  },
});

Input.test("calls onChange", ({ args }) => {
  /** trigger an onChange event */

  expect(mocked(args.onChange)).toHaveBeenCalled();
});
```

#### Waiting for data before interacting

Before a test interacts with a page or component that loads data, it waits
for an element that only renders once that data has loaded. Controls in the
page's shell (buttons, tabs, links) render before the data does, so finding
them doesn't mean the page is ready.

**BAD - test clicks a control as soon as the shell renders:**

```ts
Default.test(
  "shows this week's trending shows",
  async ({ canvas, userEvent }) => {
    await userEvent.click(
      await canvas.findByRole("button", { name: /this week/iu }),
    );

    await expect(
      await canvas.findByRole("heading", { name: /arcane/iu }),
    ).toBeInTheDocument();
  },
);
```

**GOOD - test waits for the initial data before clicking:**

```ts
Default.test(
  "shows this week's trending shows",
  async ({ canvas, userEvent }) => {
    await canvas.findByRole("heading", { name: /breaking bad/iu });

    await userEvent.click(
      await canvas.findByRole("button", { name: /this week/iu }),
    );

    await expect(
      await canvas.findByRole("heading", { name: /arcane/iu }),
    ).toBeInTheDocument();
  },
);
```

## Naming conventions

File names are kebab-case with a suffix that identifies the file's role,
matching how Knip's project patterns and the lint overrides target files:

- `*.entity.ts` — MikroORM entities
- `*.schema.ts` — Zod schemas
- `*.actor.ts` — XState actors
- `*.spec.ts` — Vitest test files
- `*.config.ts` — tool configuration (default exports allowed here)
- `*-settings.schema.ts` — Zod settings schemas, for apps, plugins, and
  packages (for plugins, see the
  [plugin SDK docs](apps/wiki/content/docs/plugin-sdk.mdx))

## Dead code and dependencies (Knip)

- `pnpm knip` regenerates API schemas before running, so consumers of
  generated code aren't falsely flagged.
- Tag an export `@lintignore` to exclude it from Knip. Use sparingly, only
  for false positives that can't be fixed another way.

## Pull request titles

Pull request titles follow
[Conventional Commits](https://www.conventionalcommits.org/), enforced by
commitlint (`@commitlint/config-conventional`). The commit `scope` must be one of a
generated enum: `repo`, `deps`, `ci`, every directory under `apps/`, and every
directory under `packages/` (with `plugin-`/`util-`/`feature-` prefixes
stripped, and `packages/core/*` subdirectories included too).

Example: `fix(seerr): handle empty response body` (scope derived from
`packages/plugin-seerr` → `seerr`).
