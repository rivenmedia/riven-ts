import { buildKubbConfig } from "@repo/core-util-kubb-config";

export default buildKubbConfig({
  input: {
    path: "./openapi-schema.json",
  },
  name: "Listrr",
  baseURL: "https://listrr.pro",
});
