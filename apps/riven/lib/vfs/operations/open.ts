import type Fuse from "fuse-native";

export const openSync = function (_path, _flags, callback) {
  callback(0, 42);
} satisfies Fuse.Operations["open"];
