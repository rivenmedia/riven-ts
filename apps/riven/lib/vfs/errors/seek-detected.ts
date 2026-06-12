import Fuse from "@zkochan/fuse-native";

import { FuseError } from "./fuse-error.ts";

/**
 * Error thrown when a seek operation is detected during a read or write operation.
 *
 * Throwing a FUSE error prompts the mount to retry the operation, which will point to the new stream position.
 */
export class SeekDetected extends FuseError {
  constructor(message: string) {
    super(Fuse.EIO, message);
  }
}
