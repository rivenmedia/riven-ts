import { HttpResponse, http } from "msw";
import { URL } from "node:url";

import { CompletedMovieSeeder } from "../../database/seeders/movies/completed-movie.seeder.ts";
import { MockScenario } from "../utilities/mock-scenario.ts";

import type { EntityManager } from "@mikro-orm/core";

const deadStreamUrl = new URL("https://example.com/dead-stream.mkv");
const aliveStreamUrl = new URL("https://example.com/alive-stream.mkv");

class DeadStreamLinkScenario extends MockScenario {
  override scenarioName = "dead-stream-link" as const;

  override environmentData = {
    RIVEN_SETTING__enabledPlugins: ["stremthru"],
  };

  override handlers = [
    http.head(deadStreamUrl.toString(), () =>
      HttpResponse.json(undefined, { status: 400 }),
    ),
    http.head(aliveStreamUrl.toString(), () =>
      HttpResponse.json(undefined, { status: 200 }),
    ),
    http.post("**/v0/store/torz/link/generate", () =>
      HttpResponse.json({
        data: {
          link: aliveStreamUrl.toString(),
        },
      }),
    ),
  ] as const;

  override readonly seeder = CompletedMovieSeeder;

  override async seed(em: EntityManager) {
    const seederInstance = new this.seeder();

    seederInstance.context.mediaEntries = [
      {
        originalFilename: "dead-stream.mkv",
        downloadUrl: "https://example.com/download-url",
        streamUrl: deadStreamUrl.toString(),
        plugin: "@repo/plugin-stremthru",
        provider: "torbox",
      },
    ];

    await seederInstance.run(em);

    em.assign(seederInstance.context.movie, {
      title: "Dead Stream Movie",
      tmdbId: "1234567890",
    });

    await em.flush();
  }
}

export const deadStreamLinkScenario = new DeadStreamLinkScenario();
