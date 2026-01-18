import { BaseDataSource, type RivenPlugin } from "@repo/util-plugin-sdk";

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

    override validate(): Promise<boolean> {
      return Promise.resolve(true);
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
      version: "1.0.0-mock",
      name: Symbol.for("@repo/plugin-test"),
      dataSources: [TestAPI],
      resolvers: [TestResolver],
      hooks: {
        "riven.core.started": vi.fn(),
        "riven.media-item.creation.error.conflict": vi.fn(),
        "riven.media-item.creation.error": vi.fn(),
        "riven.media-item.creation.success": vi.fn(),
      },
      validator() {
        return true;
      },
    } satisfies RivenPlugin,
  };
});

vi.mock<typeof import("@repo/core-util-database/database")>(
  import("@repo/core-util-database/database"),
  async (importOriginal) => {
    const { initORM } = await importOriginal();
    const { databaseConfig } = await import("@repo/core-util-database/config");
    const { SqliteDriver } = await import("@mikro-orm/sqlite");

    const database = await initORM({
      ...databaseConfig,
      driver: SqliteDriver as never,
      dbName: ":memory:",
      connect: false,
      debug: false,
    });

    await database.orm.schema.createSchema();

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
  const { database } = await import("@repo/core-util-database/database");

  await database.orm.schema.refreshDatabase();
});
