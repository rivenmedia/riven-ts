import { readFile } from "node:fs/promises";
import apib2openapi from "apib2openapi";
import { buildKubbConfig } from "@repo/core-util-kubb-config";

const apibSpec = await readFile("./lib/schema.apib", "utf-8");
const openapiSpec = await apib2openapi.convert(apibSpec, {});

export default buildKubbConfig({
  input: {
    data: openapiSpec,
  },
  name: "MDBList",
  baseURL: "https://api.mdblist.com",
});
