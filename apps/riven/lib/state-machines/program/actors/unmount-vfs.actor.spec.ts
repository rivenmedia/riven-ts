import { getGlobalDispatcher } from "undici";
import { expect, it as baseIt, vi } from "vitest";
import { createActor, toPromise } from "xstate";

import { unmountVfs } from "./unmount-vfs.actor.ts";

import type Fuse from "@zkochan/fuse-native";

type UnmountCallback = (error?: Error | null) => void;

type Unmount = (callback: UnmountCallback) => void;

const runUnmount = async (vfs: Fuse | undefined) =>
  toPromise(createActor(unmountVfs, { input: vfs }).start());

const it = baseIt
  .extend(
    "spyOnDispatcherDestroy",
    () => () => vi.spyOn(getGlobalDispatcher(), "destroy"),
  )
  .extend("createVfs", () => (unmount: Unmount) => {
    const unmountMock = vi.fn<Unmount>(unmount);

    return { vfs: { unmount: unmountMock } as unknown as Fuse, unmountMock };
  });

it("unmounts the VFS and closes the HTTP connections", async ({
  spyOnDispatcherDestroy,
  createVfs,
}) => {
  const destroy = spyOnDispatcherDestroy().mockResolvedValue();
  const { vfs, unmountMock } = createVfs((callback) => {
    callback(null);
  });

  await expect(runUnmount(vfs)).resolves.toBeUndefined();

  expect(unmountMock).toHaveBeenCalledOnce();
  expect(destroy).toHaveBeenCalledOnce();
});

it("fails when the VFS cannot be unmounted", async ({
  spyOnDispatcherDestroy,
  createVfs,
}) => {
  const destroy = spyOnDispatcherDestroy().mockResolvedValue();
  const error = new Error("Device or resource busy");

  await expect(
    runUnmount(
      createVfs((callback) => {
        callback(error);
      }).vfs,
    ),
  ).rejects.toBe(error);

  expect(destroy).not.toHaveBeenCalled();
});

it("succeeds without unmounting when there is no VFS", async ({
  spyOnDispatcherDestroy,
}) => {
  const destroy = spyOnDispatcherDestroy().mockResolvedValue();

  await expect(runUnmount(undefined)).resolves.toBeUndefined();

  expect(destroy).not.toHaveBeenCalled();
});
