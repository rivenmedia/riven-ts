import { format } from "winston";

const apiKeyPattern = /(api_?)?(token|key)[=:](\w|-)+/gi;
const userDirectoryPattern = /\/(home|Users)\/\w+\//g;

function maskMessage(message: unknown) {
  if (typeof message !== "string") {
    return message;
  }

  const hasSensitiveData =
    apiKeyPattern.test(message) || userDirectoryPattern.test(message);

  if (!hasSensitiveData) {
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
