import { buildKubbConfig } from "@repo/core-util-kubb-config";

export default buildKubbConfig({
  input: {
    path: "https://listrr.pro/swagger/v1/swagger.json",
  },
  name: "Listrr",
  baseURL: "https://listrr.pro",
});
