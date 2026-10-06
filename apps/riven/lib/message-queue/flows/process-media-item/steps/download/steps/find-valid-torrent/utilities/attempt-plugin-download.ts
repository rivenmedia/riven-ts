import assert from "node:assert";

import { attemptProviderDownload } from "./attempt-provider-download.ts";
import { getAvailableProviders } from "./get-available-providers.ts";

import type {
  FindValidTorrentContext,
  InfoHashAttemptState,
} from "#message-queue/flows/process-media-item/steps/download/steps/find-valid-torrent/find-valid-torrent.processor.ts";
import type { RivenPlugin } from "@repo/util-plugin-sdk";

/**
 * Attempts to download and validate a torrent from each of a plugin's providers.
 *
 * @throws {InvalidTorrentError} If the torrent's files failed validation
 */
export async function attemptPluginDownload(
  context: FindValidTorrentContext,
  infoHashState: InfoHashAttemptState,
  infoHash: string,
  plugin: RivenPlugin,
) {
  const pluginName = plugin.name.description;

  assert.ok(pluginName);

  context.scope.setTag("riven.downloader-plugin", pluginName);

  const hasProviderListHook = Boolean(
    plugin.hooks["riven.media-item.download.provider-list-requested"],
  );

  const { providers, hasRateLimitedProviders } = hasProviderListHook
    ? await getAvailableProviders(context, pluginName, infoHash)
    : { providers: [null], hasRateLimitedProviders: false };

  infoHashState.didEncounterRateLimit ||= hasRateLimitedProviders;

  for (const provider of providers) {
    const result = await attemptProviderDownload(
      context,
      infoHash,
      plugin,
      pluginName,
      provider,
    );

    if (result) {
      return {
        plugin: pluginName,
        result,
      };
    }
  }

  return null;
}
