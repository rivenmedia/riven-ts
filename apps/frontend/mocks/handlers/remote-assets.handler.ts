/// <reference types="vite/client" />
import { bypass, http, HttpResponse } from "msw";

/**
 * Local copies of the remote images and fonts used by stories, by their URL without the protocol
 * (e.g. `image.tmdb.org/t/p/...`).
 *
 * Large images are stored at a smaller size than their URL asks for, to keep the repository small.
 * Storybook's Next.js framework imports images as `next/image` data, rather than as a URL.
 */
const fixtureUrls = Object.fromEntries(
  Object.entries(
    import.meta.glob<string | { src: string }>("../remote-assets/**/*", {
      query: "?url",
      import: "default",
      eager: true,
    }),
  ).map(([path, asset]) => [
    path.replace("../remote-assets/", ""),
    typeof asset === "string" ? asset : asset.src,
  ]),
);

/** Hosts whose assets are served from {@link fixtureUrls} */
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
 * Serves remote assets from local copies, so snapshots don't depend on the network or on assets changing upstream.
 *
 * Assets without a local copy fail to load, so they're noticed rather than silently fetched.
 */
const fixtureHandlers = FIXTURE_HOSTS.map((host) =>
  http.get(`https://${host}/*`, async ({ request }) => {
    const { hostname, pathname } = new URL(request.url);
    const fixtureUrl = fixtureUrls[`${hostname}${pathname}`];

    if (!fixtureUrl) {
      return new HttpResponse(null, {
        status: 404,
        statusText: "No local copy in mocks/remote-assets",
      });
    }

    return fetch(bypass(new URL(fixtureUrl, globalThis.location.href)));
  }),
);

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

export const remoteAssetHandlers = [
  ...fixtureHandlers,
  placeholderImageHandler,
  missingImageHandler,
];
