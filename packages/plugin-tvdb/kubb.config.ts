import { buildKubbConfig } from "@repo/core-util-kubb-config";

export default buildKubbConfig({
  input: {
    path: "./openapi-schema.yaml",
  },
  name: "TVDB",
  baseURL: "https://api4.thetvdb.com/v4",
});
