import { format } from "winston";

import type { TransformableInfo } from "logform";

const isVfsLog = (info: TransformableInfo) =>
  info["riven.log.source"] === "vfs";

export const excludeVfsFormat = format((info) =>
  isVfsLog(info) ? false : info,
);

export const onlyVfsFormat = format((info) => (isVfsLog(info) ? info : false));
