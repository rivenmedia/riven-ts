const REQUEST_APPROVED = 4;
const REQUEST_AUTO_APPROVED = 128;

/**
 * Seerr webhook notification types, which are bit flags combined into one number.
 */
export const WebhookNotificationType = {
  REQUEST_APPROVED,
  REQUEST_AUTO_APPROVED,
  /**
   * The notification types the webhook must send, and no others.
   */
  // oxlint-disable-next-line no-bitwise
  REQUIRED: REQUEST_APPROVED | REQUEST_AUTO_APPROVED,
} as const;
