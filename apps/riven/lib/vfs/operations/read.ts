import type Fuse from "fuse-native";

export const readSync = function (_path, _fd, buf, len, pos, callback) {
  const str = "hello world".slice(pos, pos + len);

  if (!str) {
    callback(0);

    return;
  }

  buf.write(str);

  callback(str.length);
} satisfies Fuse.Operations["read"];
