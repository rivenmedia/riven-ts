import { pbkdf2, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

import { settings } from "#utilities/settings.ts";

const salt = randomBytes(16);

async function createDigest(token: string) {
  return promisify(pbkdf2)(token, salt, 100_000, 32, "sha256");
}

const apiKeyDigest = await createDigest(settings.apiKey);

/** Reads the token from an `Authorization: Bearer <token>` header. */
export function readBearerToken(authorization: string | null | undefined) {
  const bearerTokenPattern = /^Bearer +(?<token>\S+)$/iu;

  return bearerTokenPattern.exec(authorization?.trim() ?? "")?.groups?.[
    "token"
  ];
}

// Comparing digests gives `timingSafeEqual` inputs of equal length,
// so a wrong key's length cannot short-circuit the comparison.
export async function isApiKey(token: string) {
  const comparator = await createDigest(token);

  return timingSafeEqual(comparator, apiKeyDigest);
}
