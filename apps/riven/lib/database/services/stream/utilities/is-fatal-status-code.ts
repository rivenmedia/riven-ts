import { StatusCodes } from "@repo/util-plugin-sdk/utilities/status-codes";

// TODO: This should be handled on a per-plugin, per-provider basis

const fatalStatuses = new Set([
  StatusCodes.NOT_FOUND,
  StatusCodes.GONE,
  StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS,
]);

/**
 * Validates a status code returned from a stream link request to determine if the torrent link is dead on a service
 *
 * @param statusCode The HTTP status code returned from the stream link request
 * @returns True if the status code indicates the torrent link is dead on a service
 */
export function isFatalStatusCode(statusCode: number) {
  return fatalStatuses.has(statusCode);
}
