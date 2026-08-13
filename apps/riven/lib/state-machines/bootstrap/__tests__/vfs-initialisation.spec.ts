import { expect, vi } from "vitest";
import { toPromise } from "xstate";

import { settings } from "../../../utilities/settings.ts";
import { VfsMountService } from "../../../vfs/vfs.module.ts";
import { initialiseVfs } from "../actors/initialise-vfs.actor.ts";
import { it } from "./helpers/test-context.ts";

import type Fuse from "@zkochan/fuse-native";

/**
 * The mount itself, including the mount path preflight checks, is covered
 * against VfsMountService directly. This only asserts that the bootstrap actor
 * delegates to it and surfaces failures.
 */
it.override({
  initialiseVfsActorLogic: initialiseVfs,
});

it("mounts the filesystem through the VFS service", async ({
  actor,
  applicationContext,
}) => {
  const vfs = { unmount: vi.fn<Fuse["unmount"]>() } as unknown as Fuse;

  const mountSpy = vi
    .spyOn(applicationContext.get(VfsMountService), "mount")
    .mockResolvedValue(vfs);

  const output = await toPromise(actor.start());

  expect(mountSpy).toHaveBeenCalledWith(settings.vfsMountPath);
  expect(output.vfs).toBe(vfs);
});

it("surfaces a failure to mount", async ({ actor, applicationContext }) => {
  vi.spyOn(applicationContext.get(VfsMountService), "mount").mockRejectedValue(
    new Error('VFS mount path "/mnt/test-vfs-mount" does not exist.'),
  );

  await expect(toPromise(actor.start())).rejects.toThrow(/does not exist/u);
});
