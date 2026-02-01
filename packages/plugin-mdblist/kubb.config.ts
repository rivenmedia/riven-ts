import { buildKubbConfig } from "@repo/core-util-kubb-config";

export default buildKubbConfig({
  input: {
    path: "./mdblist_openapi.json",
  },
  name: "MDBList",
  baseURL: "https://mdblist.com",
});
