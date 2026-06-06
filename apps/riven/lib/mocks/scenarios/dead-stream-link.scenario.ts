import { HttpResponse, http } from "msw";
import { URL } from "node:url";

import { CompletedMovieSeeder } from "../../database/seeders/movies/completed-movie.seeder.ts";
import { mockAgent } from "../utilities/mock-agent.ts";
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
    http.post("**/v0/store/torz/link/generate", () =>
      HttpResponse.json({
        data: {
          link: aliveStreamUrl.toString(),
        },
      }),
    ),
  ] as const;

  override mockScopes = [
    mockAgent
      .get(deadStreamUrl.origin)
      .intercept({ path: deadStreamUrl.pathname })
      .reply(() => ({
        statusCode: 400,
      }))
      .persist(),
    mockAgent
      .get(aliveStreamUrl.origin)
      .intercept({ path: aliveStreamUrl.pathname })
      .reply(() => ({
        statusCode: 200,
      }))
      .persist(),
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
  }
}

export const deadStreamLinkScenario = new DeadStreamLinkScenario();
