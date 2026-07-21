import { getPluginEventSubscribers } from "../../../state-machines/main-runner/utilities/get-plugin-event-subscribers.ts";
import { BaseService } from "../core/base-service.ts";

import type { ValidPluginMap } from "../../../types/plugins.ts";
import type { MediaItem } from "@repo/util-plugin-sdk/dto/entities";
import type { RivenEvent } from "@repo/util-plugin-sdk/events";

export class PostProcessingService extends BaseService {
  readonly #postProcessingEvents = new Set<RivenEvent["type"]>([
    "riven.media-item.subtitle.requested",
  ]);

  public itemRequiresPostProcessing(_item: MediaItem, plugins: ValidPluginMap) {
    for (const event of this.#postProcessingEvents) {
      const eventSubscribers = getPluginEventSubscribers(event, plugins);

      if (eventSubscribers.length > 0) {
        return true;
      }
    }

    return false;
  }
}
