import { MDBListAPI } from "../mdblist.datasource.ts";
import { createGetListItems200 } from "../../__generated__/index.ts";
import { http, HttpResponse } from "msw";
import { it } from "@repo/core-util-vitest-test-context";
import { expect } from "vitest";

it("gets the items from the list with the given URL, appending /json to the path when not present", async ({
  server,
}) => {
  const url = "https://mdblist.com/lists/garycrawfordgc/latest-tv-shows";
  const expected = createGetListItems200().movies;

  server.use(
    http.get<{ type: string }>(`${url}/:type`, ({ params }) => {
      if (params.type !== "json") {
        return HttpResponse.json({ error: "Not Found" }, { status: 404 });
      }

      return HttpResponse.json(expected);
    }),
  );

  const mdbListApi = new MDBListAPI({ token: "test-token" });

  await expect(mdbListApi.getListItemsByUrl(url)).resolves.toEqual(expected);
});

it("gets the items from the list with the given URL, and does not append /json to the path when present", async ({
  server,
}) => {
  const url = "https://mdblist.com/lists/garycrawfordgc/latest-tv-shows/json";
  const expected = createGetListItems200().movies;

  server.use(http.get(url, () => HttpResponse.json(expected)));

  const mdbListApi = new MDBListAPI({ token: "test-token" });

  await expect(mdbListApi.getListItemsByUrl(url)).resolves.toEqual(expected);
});

it("throws an error if the URL hostname is not mdblist.com", async () => {
  const url = "https://notmdblist.com/lists/garycrawfordgc/latest-tv-shows";

  const mdbListApi = new MDBListAPI({ token: "test-token" });

  await expect(mdbListApi.getListItemsByUrl(url)).rejects.toThrow(
    "Invalid MDBList URL",
  );
});
