"use server";

import { MediaItemState } from "@repo/util-plugin-sdk/dto/enums/media-item-state.enum";

import { getClient } from "#lib/graphql/client.ts";
import { loggedInActionClient } from "#lib/server-actions/action-client.ts";

import { GET_LIBRARY_ITEMS } from "../_queries/get-library-items.query";
import { LibrarySearchForm } from "../_schemas/library-search.form-schema";

import type { MediaItemType } from "@repo/util-plugin-sdk/dto/enums/media-item-type.enum";

export const searchLibrary = loggedInActionClient
  .inputSchema(LibrarySearchForm)
  .action(async ({ parsedInput }) => {
    function getType(): MediaItemType[] {
      switch (parsedInput.type) {
        case "all": {
          return ["movie", "show"];
        }
        case "movies": {
          return ["movie"];
        }
        case "tv": {
          return ["show"];
        }
      }
    }

    function getState() {
      if (parsedInput.state === "all") {
        return [...MediaItemState.options];
      }

      return [parsedInput.state];
    }

    const { data } = await getClient().query({
      query: GET_LIBRARY_ITEMS,
      variables: {
        search: parsedInput.search ?? null,
        type: getType(),
        state: getState(),
      },
    });

    if (!data?.mediaItems) {
      throw new Error("Failed to fetch library items");
    }

    return data.mediaItems;
  });
