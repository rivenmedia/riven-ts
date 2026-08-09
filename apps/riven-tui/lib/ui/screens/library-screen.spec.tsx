import { render } from "ink-testing-library";
import { describe, expect, it, vi } from "vitest";

import { buildLibraryItem } from "../../__tests__/fixtures.ts";
import { LibraryScreen } from "./library-screen.tsx";

import type { GraphqlClient } from "../../graphql/graphql-client.ts";

const MOVIE_ID = "00000000-0000-0000-0000-000000000001";

async function tick(): Promise<void> {
  return new Promise((resolve) => {
    setImmediate(resolve);
  });
}

function buildStubClient(
  query: (options: unknown) => Promise<{ data: unknown }>,
): GraphqlClient {
  return { query } as unknown as GraphqlClient;
}

describe(LibraryScreen, () => {
  it("shows a loading indicator, then the fetched items", async () => {
    const items = [
      buildLibraryItem({ fullTitle: "Alpha Movie" }),
      buildLibraryItem({ __typename: "Show", fullTitle: "Beta Show" }),
    ];
    const query = vi
      .fn<(options: unknown) => Promise<{ data: unknown }>>()
      .mockResolvedValue({ data: { mediaItems: items } });

    const { lastFrame } = render(
      <LibraryScreen
        client={buildStubClient(query)}
        onSelectItem={vi.fn<(id: string) => void>()}
      />,
    );

    expect(lastFrame()).toContain("Loading");

    await tick();

    expect(lastFrame()).toContain("Alpha Movie");
    expect(lastFrame()).toContain("Beta Show");
  });

  it("shows an error message when the query fails", async () => {
    const query = vi
      .fn<(options: unknown) => Promise<{ data: unknown }>>()
      .mockRejectedValue(new Error("network down"));

    const { lastFrame } = render(
      <LibraryScreen
        client={buildStubClient(query)}
        onSelectItem={vi.fn<(id: string) => void>()}
      />,
    );

    await tick();

    expect(lastFrame()).toContain("network down");
  });

  it("calls onSelectItem with the highlighted item's id on enter", async () => {
    const items = [
      buildLibraryItem({ id: MOVIE_ID, fullTitle: "Alpha Movie" }),
    ];
    const query = vi
      .fn<(options: unknown) => Promise<{ data: unknown }>>()
      .mockResolvedValue({ data: { mediaItems: items } });
    const handleSelectItem = vi.fn<(id: string) => void>();

    const { stdin } = render(
      <LibraryScreen
        client={buildStubClient(query)}
        onSelectItem={(id) => {
          handleSelectItem(id);
        }}
      />,
    );

    // One tick for the query to resolve and the list to mount, another for
    // the newly-mounted `SelectList`'s `useInput` effect to attach.
    await tick();
    await tick();
    stdin.write("\r");
    await tick();

    expect(handleSelectItem).toHaveBeenCalledExactlyOnceWith(MOVIE_ID);
  });
});
