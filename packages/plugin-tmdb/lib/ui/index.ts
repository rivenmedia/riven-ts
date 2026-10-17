import { definePluginUi } from "@repo/util-plugin-sdk/ui";

export const ui = definePluginUi({
  pages: {
    "movie/[id]": {
      async load() {
        const { MoviePage } = await import("./movie/movie-page.tsx");

        return MoviePage;
      },
    },
  },
});
