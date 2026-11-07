export function generateSecret(length = 32) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  let result = "";

  for (let i = 0; i < length; i++) {
    // oxlint-disable-next-line sonarjs/pseudo-random
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}
