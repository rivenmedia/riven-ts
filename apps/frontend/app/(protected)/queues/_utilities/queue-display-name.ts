const PLUGIN_SUFFIX = /\.plugin\[[^\]]*\]$/u;
const EVENT_PREFIX = /^riven(?:-external)?\./u;
const MEDIA_ITEM_PREFIX = /^media-item\./u;

/** Turns a BullMQ queue name into the label shown in the UI. */
export function getQueueDisplayName(queueName: string): string {
  const isPluginQueue = PLUGIN_SUFFIX.test(queueName);

  const readable = isPluginQueue
    ? queueName
        .replace(PLUGIN_SUFFIX, "")
        .replace(EVENT_PREFIX, "")
        .replace(MEDIA_ITEM_PREFIX, "")
    : queueName.slice(queueName.lastIndexOf(".") + 1);

  const spaced = readable.replaceAll(/[.-]/gu, " ");

  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
