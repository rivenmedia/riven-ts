import { DateTime } from "luxon";

import type { JsonWebhookService } from "../parse-notification-url.ts";
import type { NotificationDispatcher } from "./notification-dispatcher.ts";

export const jsonWebhookDispatcher: NotificationDispatcher<JsonWebhookService> =
  {
    async send({ url }, payload) {
      const body = {
        event: "download.success",
        title: payload.title,
        fullTitle: payload.fullTitle,
        type: payload.type,
        year: payload.year,
        downloader: payload.downloader,
        provider: payload.provider,
        durationSeconds: payload.durationSeconds,
        imdbId: payload.imdbId,
        tmdbId: payload.tmdbId,
        tvdbId: payload.tvdbId,
        posterPath: payload.posterPath,
        timestamp: DateTime.utc().toISO(),
      };

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(
          "JSON webhook failed: " +
            String(response.status) +
            " " +
            response.statusText,
        );
      }
    },
  };
