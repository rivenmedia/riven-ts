import { Text } from "ink";
import { render } from "ink-testing-library";
import { describe, expect, it, vi } from "vitest";

import { SelectList } from "./select-list.tsx";

const ARROW_UP = "\u001B[A";
const ARROW_DOWN = "\u001B[B";
const ENTER = "\r";
const ESCAPE = "\u001B";

const ITEMS = ["Alpha", "Beta", "Gamma"];

/**
 * `useInput` enables raw mode - and attaches its stdin listener - from a
 * `useEffect`, which React flushes asynchronously. Writing to `stdin`
 * before that effect has run is a silent no-op, so every interaction in
 * this file is preceded by a tick to let pending effects flush.
 */
async function tick(): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

async function renderList(
  overrides: Partial<{
    handleCancel: () => void;
    handleSelect: (item: string) => void;
  }> = {},
) {
  const { handleCancel } = overrides;
  const handleSelect =
    overrides.handleSelect ?? vi.fn<(item: string) => void>();

  const result = render(
    <SelectList
      items={ITEMS}
      getKey={(item) => item}
      onSelect={(item) => {
        handleSelect(item);
      }}
      onCancel={
        handleCancel &&
        (() => {
          handleCancel();
        })
      }
      renderItem={(item, isSelected) => (
        <Text>
          {isSelected ? "> " : "  "}
          {item}
        </Text>
      )}
    />,
  );

  await tick();

  return result;
}

async function press(stdin: { write: (data: string) => void }, data: string) {
  stdin.write(data);
  await tick();
}

describe(SelectList, () => {
  it("renders every item, highlighting the first by default", async () => {
    const { lastFrame } = await renderList();

    expect(lastFrame()).toContain("> Alpha");
    expect(lastFrame()).toContain("  Beta");
    expect(lastFrame()).toContain("  Gamma");
  });

  it("moves the highlight down with the down arrow, then j", async () => {
    const { lastFrame, stdin } = await renderList();

    await press(stdin, ARROW_DOWN);
    expect(lastFrame()).toContain("> Beta");

    await press(stdin, "j");
    expect(lastFrame()).toContain("> Gamma");
  });

  it("wraps to the first item after the last", async () => {
    const { lastFrame, stdin } = await renderList();

    await press(stdin, ARROW_DOWN);
    await press(stdin, ARROW_DOWN);
    await press(stdin, ARROW_DOWN);
    expect(lastFrame()).toContain("> Alpha");
  });

  it("moves the highlight up with the up arrow, wrapping to the last item", async () => {
    const { lastFrame, stdin } = await renderList();

    await press(stdin, ARROW_UP);
    expect(lastFrame()).toContain("> Gamma");
  });

  it("calls onSelect with the highlighted item on enter", async () => {
    const handleSelect = vi.fn<(item: string) => void>();
    const { stdin } = await renderList({ handleSelect });

    await press(stdin, ARROW_DOWN);
    await press(stdin, ENTER);

    expect(handleSelect).toHaveBeenCalledExactlyOnceWith("Beta");
  });

  it("calls onCancel on escape", async () => {
    const handleCancel = vi.fn<() => void>();
    const { stdin } = await renderList({ handleCancel });

    // A lone escape byte is ambiguous with the start of a longer escape
    // sequence, so Ink holds it for `pendingInputFlushDelayMilliseconds`
    // (20ms) before treating it as a standalone "escape" keypress.
    stdin.write(ESCAPE);
    await new Promise((resolve) => {
      setTimeout(resolve, 50);
    });

    expect(handleCancel).toHaveBeenCalledOnce();
  });

  it("renders the empty message when there are no items", async () => {
    const { lastFrame } = render(
      <SelectList
        items={[]}
        getKey={(item: string) => item}
        onSelect={vi.fn<(item: string) => void>()}
        emptyMessage="Nothing here."
        renderItem={(item) => <Text>{item}</Text>}
      />,
    );

    await tick();

    expect(lastFrame()).toContain("Nothing here.");
  });
});
