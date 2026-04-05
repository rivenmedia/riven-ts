import { createSandboxedJobProcessor } from "../../utilities/create-sandboxed-job.processor.ts";
import { mapItemsToFiles } from "./utilities/map-items-to-files.ts";

export default createSandboxedJobProcessor(
  "download-item.map-items-to-files",
  function ({ job }) {
    return Promise.resolve(mapItemsToFiles(job.data.files));
  },
);
