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

Every spec under `tests/` runs in one of two suites. Playwright
registers each project twice: `chromium` runs the mocked specs and
`chromium-integrated` runs the `*.integrated.spec.ts` specs. CI runs only
Chromium.

- **Integrated** (`*.integrated.spec.ts`): write these for journeys through
  real Riven, such as signing in. Each worker boots its own Riven with a real
  Postgres and Redis, and the browser and the Next.js server talk to it
  through a proxy. The Playwright handlers forward the browser's `/graphql` and
  `/api/auth/*` requests to Riven directly, so this suite bypasses the rewrite
  in `proxy.ts`. The home, media details, library, settings, auth, login and
  registration journeys are integrated.
- **Mocked** (`*.spec.ts`): keep these for states Riven can't be put into.
  What stays mocked, and why:
  - `home.spec.ts` (the recently added carousel): Riven's `recentlyAdded`
    resolver is a stub that returns `[]`.
  - `media-details.spec.ts` (requesting the movie shows its state as it
    changes): it needs the full request pipeline mocked in Riven, which is
    phase 3.
  - `settings.spec.ts` ("the general settings don't load the plugin list"): it
    asserts that the page never sends a request, which needs the mocked
    network to record the operations.
  - `settings.every-setting-type.spec.ts`: it serves a settings schema made up
    for the test, with a setting of every type.
  - `login.spec.ts`: it needs an instance that still requires setup, but the
    integrated Riven always has its seeded users.

### Adding a journey

1. Most journeys run on the baseline scenario (`e2e-baseline`), so they need
   nothing more. Give a journey its own scenario only to seed data or to answer
   requests that are specific to it. Define it with `defineE2eScenario` in
   `apps/riven/lib/mocks/scenarios/`: it seeds the baseline first and lists
   its handlers before the baseline's. Register it in `scenarios/index.ts`, and
   add its name to `mockScenarioNames` in `@repo/util-e2e`. `e2e-library` and
   `e2e-settings` are examples.
2. Put the data that the scenario serves and the spec asserts on in
   `journeyFixtures` in `@repo/util-e2e`, so the two share one source.
3. In the spec, select the scenario with `test.use({ scenario })`. A journey
   varies Riven's state only through its scenario, never by mutating Riven
   during the test.
4. Sign in with `test.use({ signedInAs: "user" })` (or `"admin"`). It signs in
   through the real Riven after the scenario's reset, and re-adds the cookies
   for the Next.js origin. The default is signed out.

One Next.js server shares the `"use cache"` cache across every scenario and
both Playwright projects. So data a page renders through `"use cache"` must be
the same in every scenario: a TMDB or TVDB id must get the same answer
everywhere. That's why the home and details pages' TMDB and TVDB data lives in
the baseline (`tmdb-home-handlers.ts`, `tmdb-details-handlers.ts` and
`tvdb-details-handlers.ts`), not in a journey's scenario.

### The contract between the apps

`@repo/util-e2e` is the contract between the frontend and Riven. It holds the
seeded users, the scenario names, `journeyFixtures`, the control client and the
environment builder. It must stay side-effect free, as both apps import it.

Riven's environment is the same for every scenario, because Riven locks any
setting that comes from an environment variable. So the plugins aren't enabled
through `enabledPlugins` in the environment. The baseline stores every core
plugin as enabled, and Riven restores that at boot and on every reset.
`logDirectory` and `enabledLogTransports` are still set in the environment, so
they're locked.

Every request Riven makes to an external service needs a handler in a Riven
mock scenario. A request without a handler fails the test and the report
lists it, once per attempt: Riven's global undici retry dispatcher retries a
failed request 5 times, so one unhandled fetch shows up 6 times and takes about
15 seconds to fail. Riven records unhandled requests, and the test fixtures report them.
A request made while Riven boots fails the worker before its first test.
After that, the fixtures report them only for the span of one test. Applying a
test's scenario resets the instance and clears the list, and the check runs at
the end of the test. A request made after one test's check and before the next
test's reset is refused but never reported, and it doesn't show up in the next
test either, so a missing handler there can go unnoticed.

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

CI runs `workers: 1`. Locally, each `-integrated` project is capped at 4
workers, rather than 4 in total.

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
