import { HttpResponse, http } from "msw";
import { expect } from "vitest";

import { it } from "../../__tests__/plex.test-context.ts";
import { PlexAPI } from "../plex.datasource.ts";

it("refreshes the matching library section", async ({
  server,
  dataSourceMap,
}) => {
  let refreshCalled = false;

  server.use(
    http.get("**/library/sections", () =>
      HttpResponse.json({
        MediaContainer: {
          Directory: [
            {
              key: "1",
              type: "movie",
              language: "en",
              uuid: "uuid-1",
              Location: [{ path: "plex-library-path/movies" }],
            },
            {
              key: "2",
              type: "show",
              language: "en",
              uuid: "uuid-2",
              Location: [{ path: "plex-library-path/shows" }],
            },
          ],
        },
      }),
    ),
    http.post("**/library/sections/1/refresh", () => {
      refreshCalled = true;

      return HttpResponse.json({ success: true });
    }),
  );

  const api = dataSourceMap.get(PlexAPI);
  await api.updateSection("/movies/test.mkv");

  expect(refreshCalled).toBe(true);
});

it("throws when no matching section found", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/library/sections", () =>
      HttpResponse.json({
        MediaContainer: {
          Directory: [
            {
              key: "1",
              type: "movie",
              language: "en",
              uuid: "uuid-1",
              Location: [{ path: "plex-library-path/other" }],
            },
          ],
        },
      }),
    ),
  );

  const api = dataSourceMap.get(PlexAPI);

  await expect(api.updateSection("/nonexistent/file.mkv")).rejects.toThrow(
    /No matching library section/,
  );
});

it("throws when directory key is missing", async ({
  server,
  dataSourceMap,
}) => {
  server.use(
    http.get("**/library/sections", () =>
      HttpResponse.json({
        MediaContainer: {
          Directory: [
            {
              type: "movie",
              language: "en",
              uuid: "uuid-1",
              Location: [{ path: "plex-library-path/movies" }],
            },
          ],
        },
      }),
    ),
  );

  const api = dataSourceMap.get(PlexAPI);

  await expect(api.updateSection("/movies/test.mkv")).rejects.toThrow(
    /Directory key is missing/,
  );
});
