import { getGlobalDispatcher } from "undici";
import { expect, it, vi } from "vitest";
import { createActor, toPromise } from "xstate";

import { unmountVfs } from "./unmount-vfs.actor.ts";

import type Fuse from "@zkochan/fuse-native";

type UnmountCallback = (error?: Error | null) => void;

type Unmount = (callback: UnmountCallback) => void;

const createVfs = (unmount: Unmount) => {
  const unmountMock = vi.fn<Unmount>(unmount);

  return { vfs: { unmount: unmountMock } as unknown as Fuse, unmountMock };
};

const runUnmount = async (vfs: Fuse | undefined) =>
  toPromise(createActor(unmountVfs, { input: vfs }).start());

it("unmounts the VFS and closes the HTTP connections", async () => {
  const destroy = vi
    .spyOn(getGlobalDispatcher(), "destroy")
    .mockResolvedValue();
  const { vfs, unmountMock } = createVfs((callback) => {
    callback(null);
  });

  await expect(runUnmount(vfs)).resolves.toBeUndefined();

  expect(unmountMock).toHaveBeenCalledOnce();
  expect(destroy).toHaveBeenCalledOnce();
});

it("fails when the VFS cannot be unmounted", async () => {
  const destroy = vi
    .spyOn(getGlobalDispatcher(), "destroy")
    .mockResolvedValue();
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

it("succeeds without unmounting when there is no VFS", async () => {
  const destroy = vi
    .spyOn(getGlobalDispatcher(), "destroy")
    .mockResolvedValue();

  await expect(runUnmount(undefined)).resolves.toBeUndefined();

  expect(destroy).not.toHaveBeenCalled();
});
