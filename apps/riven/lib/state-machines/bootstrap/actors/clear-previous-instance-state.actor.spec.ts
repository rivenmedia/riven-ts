import { Movie } from "@repo/util-plugin-sdk/dto/entities";

import { RedisConnection } from "bullmq";
import { expect } from "vitest";
import { createActor, toPromise } from "xstate";

import { it as baseIt } from "#__tests__/test-context.ts";
import { User } from "#database/entities/user.entity.ts";
import { settings } from "#utilities/settings.ts";

import { clearPreviousInstanceState } from "./clear-previous-instance-state.actor.ts";

import type { ClearPreviousInstanceStateInput } from "./clear-previous-instance-state.actor.ts";

const runClear = async (input: Partial<ClearPreviousInstanceStateInput>) =>
  toPromise(
    createActor(clearPreviousInstanceState, {
      input: {
        wipeRedis: false,
        wipeDatabase: false,
        wipeUsers: false,
        ...input,
      },
    }).start(),
  );

const it = baseIt
  .extend("redis", async ({}, { onCleanup }) => {
    const connection = new RedisConnection({ url: settings.redisUrl });
    const client = await connection.client;

    onCleanup(async () => connection.close());

    return client;
  })
  .extend("seededState", async ({ completedMovieContext, em, redis }) => {
    em.create(User, {
      name: "user",
      email: "user@riven.test",
      emailVerified: false,
      banned: false,
      username: "user",
      updatedAt: new Date(),
    });

    await em.flush();
    await redis.set("riven:test-key", "value");

    return completedMovieContext;
  });

it("keeps all state when nothing is wiped", async ({
  em,
  redis,
  seededState,
}) => {
  await runClear({});

  await expect(redis.get("riven:test-key")).resolves.toBe("value");
  await expect(em.fork().count(Movie)).resolves.toBe(1);
  await expect(em.fork().count(User)).resolves.toBe(1);
  expect(seededState.completedMovie).toBeDefined();
});

it("wipes Redis", async ({ em, redis, seededState }) => {
  await runClear({ wipeRedis: true });

  await expect(redis.get("riven:test-key")).resolves.toBeNull();
  await expect(em.fork().count(Movie)).resolves.toBe(1);
  expect(seededState.completedMovie).toBeDefined();
});

it("wipes users without wiping media", async ({ em, redis, seededState }) => {
  await runClear({ wipeUsers: true });

  await expect(em.fork().count(User)).resolves.toBe(0);
  await expect(em.fork().count(Movie)).resolves.toBe(1);
  await expect(redis.get("riven:test-key")).resolves.toBe("value");
  expect(seededState.completedMovie).toBeDefined();
});
