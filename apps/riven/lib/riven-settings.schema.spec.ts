import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, it } from "vitest";

import { RivenSettings } from "./riven-settings.schema.ts";

const requiredSettings = Object.freeze({
  databaseUrl: "postgresql://riven@localhost/riven",
  redisUrl: "redis://localhost:6379",
  vfsMountPath: "/mnt/riven",
});

it("apiKey setting rejects a key shorter than 32 characters", () => {
  const { error } = RivenSettings.safeParse({
    ...requiredSettings,
    apiKey: "k".repeat(31),
  });

  expect(error?.issues).toStrictEqual([
    expect.objectContaining({ code: "too_small", path: ["apiKey"] }),
  ]);
});

it("apiKey setting accepts a key of 32 characters", () => {
  expect(
    RivenSettings.parse({ ...requiredSettings, apiKey: "k".repeat(32) }),
  ).toHaveProperty("apiKey", "k".repeat(32));
});

it("apiKey setting resolves to a generated key when unset", () => {
  const { apiKey } = RivenSettings.parse(requiredSettings);

  expect(apiKey.length).toBeGreaterThanOrEqual(32);
  expect(RivenSettings.parse(requiredSettings).apiKey).toBe(apiKey);
});

it("adminUserCredentials setting parses a username and password", () => {
  expect(
    RivenSettings.parse({
      ...requiredSettings,
      adminUserCredentials: "admin:correct-horse",
    }).adminUserCredentials,
  ).toStrictEqual({ username: "admin", password: "correct-horse" });
});

it("adminUserCredentials setting keeps colons in the password", () => {
  expect(
    RivenSettings.parse({
      ...requiredSettings,
      adminUserCredentials: "admin:pass:word",
    }).adminUserCredentials,
  ).toStrictEqual({ username: "admin", password: "pass:word" });
});

it("adminUserCredentials setting is null when unset", () => {
  expect(RivenSettings.parse(requiredSettings).adminUserCredentials).toBeNull();
});

it.for(["admin", "admin:", ":password", ":a:b"])(
  "adminUserCredentials setting rejects %j",
  (adminUserCredentials) => {
    expect(
      RivenSettings.safeParse({ ...requiredSettings, adminUserCredentials })
        .error?.issues,
    ).toStrictEqual([
      expect.objectContaining({ path: ["adminUserCredentials"] }),
    ]);
  },
);

it("database SSL settings read the certificates from their files", async () => {
  const directory = await mkdtemp(path.join(tmpdir(), "riven-ssl-"));

  try {
    const files = {
      databaseSslRootCert: ["ca.pem", "root certificate"],
      databaseSslCert: ["cert.pem", "client certificate"],
      databaseSslKey: ["key.pem", "client key"],
    } as const;

    for (const [fileName, contents] of Object.values(files)) {
      await writeFile(path.join(directory, fileName), contents);
    }

    expect(
      RivenSettings.parse({
        ...requiredSettings,
        ...Object.fromEntries(
          Object.entries(files).map(([setting, [fileName]]) => [
            setting,
            path.join(directory, fileName),
          ]),
        ),
      }),
    ).toMatchObject({
      databaseSslRootCert: "root certificate",
      databaseSslCert: "client certificate",
      databaseSslKey: "client key",
    });
  } finally {
    await rm(directory, { recursive: true });
  }
});
