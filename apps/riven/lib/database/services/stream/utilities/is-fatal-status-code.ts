import { StatusCodes } from "http-status-codes";

// TODO: This should be handled on a per-plugin, per-provider basis

const fatalStatuses = new Set([
  StatusCodes.NOT_FOUND,
  StatusCodes.GONE,
  StatusCodes.UNAVAILABLE_FOR_LEGAL_REASONS,
  // StatusCodes.SERVICE_UNAVAILABLE, // TODO: This may not be correct for StremThru; needs validation hence disabled for now
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
