import { describe, expect, it } from "vitest";

import { toLibraryItems } from "./use-library-items.ts";

import type { GetLibraryItemsQuery } from "../queries/get-library-items.query.typegen.ts";

const ID_1 = "00000000-0000-0000-0000-000000000001";
const ID_2 = "00000000-0000-0000-0000-000000000002";
const ID_3 = "00000000-0000-0000-0000-000000000003";
const ID_4 = "00000000-0000-0000-0000-000000000004";

describe(toLibraryItems, () => {
  it("keeps only movies and shows, dropping seasons and episodes", () => {
    const mediaItems: GetLibraryItemsQuery["mediaItems"] = [
      { __typename: "Movie", id: ID_1, fullTitle: "Movie", state: "completed" },
      { __typename: "Show", id: ID_2, fullTitle: "Show", state: "completed" },
      {
        __typename: "Season",
        id: ID_3,
        fullTitle: "Season",
        state: "completed",
      },
      {
        __typename: "Episode",
        id: ID_4,
        fullTitle: "Episode",
        state: "completed",
      },
    ];

    expect(
      toLibraryItems(mediaItems).map((item) => item.__typename),
    ).toStrictEqual(["Movie", "Show"]);
  });

  it("sorts items alphabetically by full title", () => {
    const mediaItems: GetLibraryItemsQuery["mediaItems"] = [
      { __typename: "Movie", id: ID_1, fullTitle: "Zeta", state: "completed" },
      { __typename: "Show", id: ID_2, fullTitle: "Alpha", state: "completed" },
      { __typename: "Movie", id: ID_3, fullTitle: "Mid", state: "completed" },
    ];

    expect(
      toLibraryItems(mediaItems).map((item) => item.fullTitle),
    ).toStrictEqual(["Alpha", "Mid", "Zeta"]);
  });
});
