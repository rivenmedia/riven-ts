import { format } from "winston";

const apiKeyPattern =
  /(?<prefix>api|access_?)?(?<keyType>token|key)[=:](?<keyValue>\w|-)+/giu;
const userDirectoryPattern = /\/(?<directoryName>home|Users)\/\w+\//gu;

function maskMessage(message: unknown) {
  if (typeof message !== "string") {
    return message;
  }

  return message
    .replaceAll(apiKeyPattern, "$1$2=[REDACTED]")
    .replaceAll(userDirectoryPattern, "/$1/[REDACTED]/");
}

export const maskFormat = format((info) => {
  info.message = maskMessage(info.message);

  return info;
});
