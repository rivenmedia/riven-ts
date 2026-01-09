import { buildKubbConfig } from "@repo/core-util-kubb-config";

export default buildKubbConfig({
  input: {
    path: "https://developer.themoviedb.org/openapi/tmdb-api.json",
  },
  name: "TMDB",
  baseURL: "https://api.themoviedb.org",
});
