import type Fuse from "fuse-native";

export const releaseSync = function (_path, _fh, callback) {
  callback(0);
} satisfies Fuse.Operations["release"];
