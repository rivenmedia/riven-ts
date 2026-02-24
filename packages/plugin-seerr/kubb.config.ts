import { buildKubbConfig } from "@repo/core-util-kubb-config";

export default buildKubbConfig({
  input: {
    path: "./overseerr-api.yml",
  },
  name: "Seerr",
  baseURL: "http://localhost:5055",
});
