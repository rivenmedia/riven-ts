import { buildKubbConfig } from "@repo/core-util-kubb-config";

export default buildKubbConfig({
  input: {
    path: "./openapi-schema.json",
  },
  name: "TMDB",
  baseURL: "https://api.themoviedb.org",
});
