import { BaseDataSource, createPluginRunner } from "@repo/util-plugin-sdk";

import { DataSource } from "typeorm";
import { type Mock, beforeEach, expect, vi } from "vitest";

vi.mock<{ default: Record<string, unknown> }>(
  import("./package.json"),
  () =>
    ({
      default: {
        name: "riven",
        version: "1.0.0-mock",
        dependencies: {
          "@repo/plugin-test": "workspace:^",
        },
      },
    }) as const,
);

vi.mock<typeof import("@apollo/server/standalone")>(
  import("@apollo/server/standalone"),
  () => ({
    startStandaloneServer: vi.fn().mockResolvedValue({
      url: "http://localhost:4000/mocked-server",
    }),
  }),
);

vi.mock<typeof import("@repo/plugin-test")>(import("@repo/plugin-test"), () => {
  class TestAPI extends BaseDataSource {
    override baseURL = "https://api.test.com";

    // eslint-disable-next-line @typescript-eslint/require-await
    override async validate(): Promise<boolean> {
      return true;
    }

    static override getApiToken(): string | undefined {
      return "TEST_API_TOKEN";
    }
  }

  class TestResolver {
    // eslint-disable-next-line @typescript-eslint/require-await
    async testIsValid(): Promise<boolean> {
      return true;
    }
  }

  return {
    default: {
      name: Symbol.for("Plugin: Test"),
      dataSources: [TestAPI],
      resolvers: [TestResolver],
      runner: createPluginRunner(() => {
        /* empty */
      }),
      validator() {
        return true;
      },
    },
  };
});

vi.mock<typeof import("@repo/core-util-database/connection")>(
  import("@repo/core-util-database/connection"),
  async (importOriginal) => {
    const { entities } = await importOriginal();

    const database = new DataSource({
      type: "sqlite",
      database: ":memory:",
      synchronize: true,
      dropSchema: true,
      entities,
    });

    await database.initialize();

    return {
      database,
    };
  },
);

expect.extend({
  toHaveReceivedEvent(actorRef: { id: string; send: Mock }, expected: unknown) {
    try {
      expect(actorRef.send).toHaveBeenCalledWith(expected);

      return {
        pass: true,
        message: () =>
          `Actor "${actorRef.id}" received event:\n${this.utils.printExpected(expected)}`,
      };
    } catch {
      return {
        pass: false,
        message: () =>
          `Actor "${actorRef.id}" did not receive event:\n${this.utils.printReceived(expected)}.\nReceived events:\n${this.utils.printExpected(actorRef.send.mock.calls.flatMap((x: unknown) => x))}`,
      };
    }
  },
});

beforeEach(async () => {
  const { database } = await import("@repo/core-util-database/connection");

  await database.synchronize(true);
});
