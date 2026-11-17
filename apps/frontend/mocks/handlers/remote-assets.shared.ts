import { http, HttpResponse } from "msw";

/** Hosts whose assets have local copies in `mocks/remote-assets` */
const FIXTURE_HOSTS = [
  "image.tmdb.org",
  "artworks.thetvdb.com",
  "images.pexels.com",
  "github.com",
  "cdn.jsdelivr.net",
  // `next/font/google` loads fonts from Google in Storybook, rather than self-hosting them
  "fonts.gstatic.com",
];

/**
 * Serves a local copy of a remote asset.
 *
 * @param fixturePath The asset's path in `mocks/remote-assets`, i.e. its URL without the protocol
 * @returns The asset, or `undefined` if there's no local copy
 */
type ServeFixture = (
  fixturePath: string,
) => Response | undefined | Promise<Response | undefined>;

/** Hashes a string into a hue, so each placeholder has a stable colour */
const toHue = (value: string) => {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + (value.codePointAt(index) ?? 0)) % 360;
  }

  return hash;
};

/**
 * Serves a placeholder for Faker's image URLs (e.g. `https://picsum.photos/seed/abc/200/300`),
 * as their seeds depend on how much random data was generated before them.
 */
const placeholderImageHandler = http.get<{
  seed: string;
  width: string;
  height: string;
}>(
  "https://picsum.photos/seed/:seed/:width/:height",
  ({ params: { seed, width, height } }) =>
    new HttpResponse(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="hsl(${String(toHue(seed))} 40% 40%)"/></svg>`,
      { headers: { "Content-Type": "image/svg+xml" } },
    ),
);

/** Images that are expected to fail to load, e.g. to show an avatar's fallback */
const missingImageHandler = http.get(
  "https://example.com/*",
  () => new HttpResponse(null, { status: 404 }),
);

/**
 * Serves remote assets from local copies, so tests don't depend on the network or on assets changing upstream.
 *
 * Assets without a local copy fail to load, so they're noticed rather than silently fetched.
 */
export const createRemoteAssetHandlers = (serveFixture: ServeFixture) => [
  ...FIXTURE_HOSTS.map((host) =>
    http.get(`https://${host}/*`, async ({ request }) => {
      const { hostname, pathname } = new URL(request.url);

      return (
        (await serveFixture(`${hostname}${pathname}`)) ??
        new HttpResponse(null, {
          status: 404,
          statusText: "No local copy in mocks/remote-assets",
        })
      );
    }),
  ),
  placeholderImageHandler,
  missingImageHandler,
];
