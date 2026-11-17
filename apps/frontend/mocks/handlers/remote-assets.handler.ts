/// <reference types="vite/client" />
import { bypass } from "msw";

import { createRemoteAssetHandlers } from "./remote-assets.shared.ts";

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

export const remoteAssetHandlers = createRemoteAssetHandlers((fixturePath) => {
  const fixtureUrl = fixtureUrls[fixturePath];

  return fixtureUrl
    ? fetch(bypass(new URL(fixtureUrl, globalThis.location.href)))
    : undefined;
});
