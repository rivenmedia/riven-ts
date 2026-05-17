import { format } from "winston";

function maskMessage(message: unknown) {
  if (typeof message !== "string") {
    return message;
  }

  const apiKeyPattern = /(api_?)?(token|key)[=:](\w|-)+/gi;
  const hasSensitiveData = apiKeyPattern.test(message);

  if (!hasSensitiveData) {
    return message;
  }

  return message.replaceAll(apiKeyPattern, (match) => {
    const [prefix] = match.split(/[:=]/);

    if (!prefix) {
      return match;
    }

    return `${prefix}=[REDACTED]`;
  });
}

export const maskFormat = format((info) => {
  info.message = maskMessage(info.message);

  return info;
});
