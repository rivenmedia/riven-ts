import Fuse from "@zkochan/fuse-native";

import { FuseError } from "./fuse-error.ts";

export class SeekError extends FuseError {
  constructor(message: string) {
    super(Fuse.EIO, message);
  }
}
