import Fuse from "@zkochan/fuse-native";
import * as fs from "node:fs/promises";
import { expect, vi } from "vitest";
import { toPromise } from "xstate";

import { initialiseVfs } from "#state-machines/bootstrap/actors/initialise-vfs.actor.ts";

import { it as baseIt } from "./helpers/test-context.ts";

import type { Stats } from "node:fs";

vi.mock(import("@zkochan/fuse-native"));
vi.mock(import("node:fs/promises"), { spy: true });

const it = baseIt
  .extend("removeProcessIds", () => () => {
    // @ts-expect-error - We are intentionally mocking these functions to return undefined to simulate the error condition
    vi.spyOn(process, "getuid", "get").mockReturnValue(undefined);

    // @ts-expect-error - We are intentionally mocking these functions to return undefined to simulate the error condition
    vi.spyOn(process, "getgid", "get").mockReturnValue(undefined);
  })
  .extend("spyOnFsStat", () => () => vi.spyOn(fs, "stat"))
  .extend("spyOnProcessGetuid", () => () => vi.spyOn(process, "getuid"))
  .extend("spyOnProcessGetgid", () => () => vi.spyOn(process, "getgid"));

it.override({
  initialiseVfsActorLogic: initialiseVfs,
});

it("throws an error if process UID or GID cannot be determined", async ({
  removeProcessIds,
  actor,
}) => {
  removeProcessIds();

  await expect(toPromise(actor.start())).rejects.toThrow(
    /unable to determine process uid or gid/iu,
  );
});

it("throws an error if the mount path does not exist", async ({
  spyOnFsStat,
  actor,
}) => {
  const error = new Error("ENOENT: no such file or directory");

  // @ts-expect-error - We are intentionally adding a code property to the error to simulate the ENOENT error condition
  error.code = "ENOENT";

  spyOnFsStat().mockRejectedValue(error);

  await expect(toPromise(actor.start())).rejects.toThrow(
    /VFS mount path "(.*)" does not exist. Please create this directory./u,
  );
});

it("throws an error if the mount path is not a directory", async ({
  spyOnFsStat,
  actor,
}) => {
  spyOnFsStat().mockResolvedValue({
    isDirectory: vi.fn<Stats["isDirectory"]>().mockReturnValue(false),
  } as never);

  await expect(toPromise(actor.start())).rejects.toThrow(
    /VFS mount path "(.*)" exists, but is not a directory./u,
  );
});

it("throws an error if the mount path is not owned by the current user", async ({
  spyOnFsStat,
  spyOnProcessGetuid,
  spyOnProcessGetgid,
  actor,
}) => {
  const uid = 1000;
  const gid = 1000;

  spyOnProcessGetuid().mockReturnValue(uid);
  spyOnProcessGetgid().mockReturnValue(gid);

  spyOnFsStat().mockResolvedValue({
    isDirectory: vi.fn<Stats["isDirectory"]>().mockReturnValue(true),
    uid: 9999,
    gid: 9999,
  } as never);

  await expect(toPromise(actor.start())).rejects.toThrow(
    /VFS mount path "(.*)" is not owned by the current user./u,
  );
});

it("does not throw an error if the mount path is present and owned by the current user", async ({
  spyOnFsStat,
  spyOnProcessGetuid,
  spyOnProcessGetgid,
  actor,
}) => {
  const uid = 1000;
  const gid = 1000;

  spyOnProcessGetuid().mockReturnValue(uid);
  spyOnProcessGetgid().mockReturnValue(gid);

  spyOnFsStat().mockResolvedValue({
    isDirectory: vi.fn<Stats["isDirectory"]>().mockReturnValue(true),
    uid,
    gid,
  } as never);

  // oxlint-disable-next-line prefer-arrow-callback vitest/prefer-mock-return-shorthand - This is needed to provide a class constructor for the Fuse mock implementation
  vi.mocked(Fuse).mockImplementation(function MockFuseConstructor() {
    return {
      mount: vi.fn<InstanceType<typeof Fuse>["mount"]>((cb) => {
        cb(null);
      }),
    } as never;
  });

  await expect(toPromise(actor.start())).resolves.not.toThrow();
});
