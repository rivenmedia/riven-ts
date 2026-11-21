# Agents

<!-- BEGIN:storybook-skills -->
<!-- Storybook updates this section on upgrade. Remove both markers to keep your own edits. -->

## Storybook

For every change to how the UI looks (you create, change, or delete a component, story, style, theme, or design token), follow these steps in order. Each step has a Storybook skill. First invoke the skills of all the steps, before you edit any file. Then follow each skill at its step.

1. `component-docs`: look up the components to reuse, with their props and usage examples, before you edit any file. Also when the user asks about a component's props, API, or usage.
2. `write-stories`: every component you create or change gets stories.
3. `test-stories`: run the story tests after every change, the way this skill says, never with a `package.json` test script, and fix what fails. Also when the user asks to run or fix story tests.
4. `ui-review`: publish a review that shows the user what changed, as your last step. Also when the user asks to see components or stories.

<!-- END:storybook-skills -->

> **Note:** the block between `BEGIN:storybook-skills` and `END:storybook-skills` is managed by Storybook and overwritten on upgrade. Put project-specific Storybook rules outside it, like the section below.

## Storybook tests

### Story reuse

When writing Storybook tests, prefer to re-use existing stories instead of creating new ones, unless none satisfy the needs of the initial test's state.

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

### Prefer args targeting

When writing Storybook stories, prefer to assert against args provided to the story under test instead of a variable in a parent scope.

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

## Tests

### Prefer type narrowing

When writing tests, prefer to use type narrowing by using `expect.assert()` rather than type assertions.
