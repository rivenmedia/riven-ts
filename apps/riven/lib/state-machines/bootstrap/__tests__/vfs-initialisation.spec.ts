import Fuse from "@zkochan/fuse-native";
import * as fs from "node:fs/promises";
import { expect, vi } from "vitest";
import { toPromise } from "xstate";

import { initialiseVfs } from "../actors/initialise-vfs.actor.ts";
import { it } from "./helpers/test-context.ts";

vi.mock(import("@zkochan/fuse-native"));
vi.mock(import("node:fs/promises"), { spy: true });

it.scoped({
  initialiseVfsActorLogic: initialiseVfs,
});

it("throws an error if process UID or GID cannot be determined", async ({
  actor,
}) => {
  // @ts-expect-error - We are intentionally mocking these functions to return undefined to simulate the error condition
  vi.spyOn(process, "getuid", "get").mockReturnValue(undefined);

  // @ts-expect-error - We are intentionally mocking these functions to return undefined to simulate the error condition
  vi.spyOn(process, "getgid", "get").mockReturnValue(undefined);

  await expect(toPromise(actor.start())).rejects.toThrow();
});

it("throws an error if the mount path does not exist", async ({ actor }) => {
  vi.spyOn(fs, "lstat").mockRejectedValue(
    new Error("ENOENT: no such file or directory"),
  );

  await expect(toPromise(actor.start())).rejects.toThrow(
    /VFS mount path "(.*)" does not exist. Please create this directory./,
  );
});

it("throws an error if the mount path is not a directory", async ({
  actor,
}) => {
  vi.spyOn(fs, "lstat").mockResolvedValue({
    isDirectory: vi.fn().mockReturnValue(false),
  } as never);

  await expect(toPromise(actor.start())).rejects.toThrow(
    /VFS mount path "(.*)" exists, but is not a directory./,
  );
});

it("throws an error if the mount path is not owned by the current user", async ({
  actor,
}) => {
  const uid = 1000;
  const gid = 1000;

  vi.spyOn(process, "getuid").mockReturnValue(uid);
  vi.spyOn(process, "getgid").mockReturnValue(gid);

  vi.spyOn(fs, "lstat").mockResolvedValue({
    isDirectory: vi.fn().mockReturnValue(true),
    uid: 9999,
    gid: 9999,
  } as never);

  await expect(toPromise(actor.start())).rejects.toThrow(
    /VFS mount path "(.*)" is not owned by the current user./,
  );
});

it("does not throw an error if the mount path is present and owned by the current user", async ({
  actor,
}) => {
  const uid = 1000;
  const gid = 1000;

  vi.spyOn(process, "getuid").mockReturnValue(uid);
  vi.spyOn(process, "getgid").mockReturnValue(gid);

  vi.spyOn(fs, "lstat").mockResolvedValue({
    isDirectory: vi.fn().mockReturnValue(true),
    uid,
    gid,
  } as never);

  vi.mocked(Fuse).mockImplementation(function MockFuseConstructor() {
    return {
      mount: vi.fn((cb: (err?: Error | null) => void) => {
        cb(null);
      }),
    } as never;
  });

  await expect(toPromise(actor.start())).resolves.not.toThrow();
});
