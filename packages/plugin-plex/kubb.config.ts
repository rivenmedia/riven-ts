import { buildKubbConfig } from "@repo/core-util-kubb-config";

export default buildKubbConfig({
  input: {
    path: "./openapi-schema.yaml",
  },
  name: "Plex",
  baseURL: "https://plex.com/api/",
});
