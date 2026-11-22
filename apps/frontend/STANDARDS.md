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
