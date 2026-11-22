# Frontend Standards

Extends the repo-wide [STANDARDS.md](../../STANDARDS.md); everything there still
applies.

## Browser checks

- For components that can't render on the server, use
  [`use(browser())`](https://react.dev/reference/react-dom/browser) inside
  a `<Suspense>` boundary.
- For plain code that runs in both environments, use
  `"window" in globalThis`, not `typeof window`. Story tests compile
  `typeof window` to `"undefined"`, so browser-only branches silently never
  run under test.

## E2E suites

Every spec under `playwright/` runs in one of two suites. Playwright
registers each project twice: `chromium` runs the mocked specs and
`chromium-integrated` runs the `*.integrated.spec.ts` specs. CI runs only
Chromium.

- **Integrated** (`*.integrated.spec.ts`): write these for journeys through
  real Riven, such as signing in. Each worker boots its own Riven with a real
  Postgres and Redis, and the browser and the Next.js server talk to it
  through a proxy.
- **Mocked** (`*.spec.ts`): keep these for states Riven can't be put into,
  such as a failing backend or every setting type.

Every request Riven makes to an external service needs a handler in a Riven
mock scenario. A request without a handler fails the test and the report
lists it. Requests made between tests, after one test's reset and before the
next test's scenario, are refused but not reported, so a missing handler
there shows up as a failure in the next test, or not at all.

### Running locally

You need:

- Postgres, via `docker compose --profile services up riven-db`
- `redis-server` on `PATH`
- FUSE, with `user_allow_other` set in `/etc/fuse.conf`

Then run the tests from `apps/frontend`, with the connection string of that
Postgres:

```sh
E2E_POSTGRES_URL=postgres://postgres:<password>@127.0.0.1:5432/postgres \
  pnpm e2e:headless --project=chromium-integrated
```

CI provides the same three with `runner-requirements` in `verify.yaml`.

### Known issue: the browser auth origin

The browser's auth client always uses the default `ORIGIN`,
`https://localhost:9000`, because `privateEnvironment.ORIGIN` is undefined in
the browser. The mocked suite hides this, as its handlers match any origin.
The integrated fixtures forward that origin to Riven through
`browserAuthOrigin`. Remove that once the frontend uses the page's own
origin.

## Storybook tests

### Story reuse

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

### Args targeting

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

### Waiting for data before interacting

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
