import {
  createGetListItemsByNameQueryResponse,
  getListItemsHandler,
} from "../../__generated__/index.ts";
import { MDBListAPI } from "../mdblist.datasource.ts";
import { HttpResponse } from "msw";
import { it } from "@repo/core-util-vitest-test-context";
import { expect } from "vitest";

it("gets the items from the list with the given ID", async ({ server }) => {
  const mockListItemsResponse = createGetListItemsByNameQueryResponse();

  server.use(
    getListItemsHandler(({ params }) => {
      if (params["listid"] !== "123") {
        return HttpResponse.json(
          { message: "List not found" },
          { status: 404 },
        );
      }

      return HttpResponse.json(mockListItemsResponse);
    }),
  );

  const mdbListApi = new MDBListAPI({ token: "test-token" });
  const items = await mdbListApi.getListItemsById(123);

  expect(items).toEqual(mockListItemsResponse);
});
