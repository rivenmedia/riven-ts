import { buildKubbConfig } from "@repo/core-util-kubb-config";

export default buildKubbConfig({
  input: {
    path: "https://raw.githubusercontent.com/LukasParke/plex-api-spec/refs/heads/main/plex-api-spec.yaml",
  },
  name: "Plex",
  baseURL: "https://plex.com/api/",
});
