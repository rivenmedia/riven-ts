import { logger } from "../../utilities/logger/logger.ts";
import {
  fdToCurrentStreamPositionMap,
  fdToResponsePromiseMap,
} from "./file-handle-map.ts";
import { getVfsOperationContext } from "./vfs-operation-context.ts";

/**
 * Handles a stream seek when reusing an existing file descriptor.
 *
 * Closes the existing stream and opens a new one from the new position.
 *
 * @param from The previous stream position
 * @param to The new stream position
 */
export function seek(from: number, to: number) {
  const {
    fd,
    context: { responsePromise, seekController },
  } = getVfsOperationContext("read");

  logger.debug(
    `Seeking to new start position for fd ${fd.toString()} (${from.toString()} -> ${to.toString()})`,
  );

  // Drain without blocking. We don't want a slow or large stream to delay the reconnect.
  void responsePromise?.then(({ body }) => body.dump());

  fdToResponsePromiseMap.delete(fd);
  fdToCurrentStreamPositionMap.delete(fd);

  seekController.abort();
}
