import { Injectable, Module } from "@nestjs/common";
import Fuse from "@zkochan/fuse-native";
import dedent from "dedent";
import { stat } from "node:fs/promises";
import { getGlobalDispatcher } from "undici";

import { InjectLogger } from "../logging/logging.module.ts";
import { InjectSettings } from "../settings/settings.module.ts";
import { fuseOperations } from "./index.ts";

import type { RivenLogger } from "../logging/logging.module.ts";
import type { RivenSettingsValues } from "../settings/settings.module.ts";

/**
 * Owns the FUSE mount backing Riven's virtual filesystem.
 *
 * Mounting is exposed as explicit methods rather than lifecycle hooks. The
 * bootstrap sequence mounts the filesystem only after the database, plugins and
 * GraphQL server are ready, and the container is created part-way through that
 * sequence, so binding the mount to container creation would both reorder
 * startup and mount a real filesystem in every test that builds the container.
 * The lifecycle hooks follow once Nest owns the bootstrap sequence itself.
 */
@Injectable()
export class VfsMountService {
  private readonly settings: RivenSettingsValues;
  private readonly logger: RivenLogger;
  private vfs: Fuse | undefined;

  public constructor(
    @InjectSettings() settings: RivenSettingsValues,
    @InjectLogger() logger: RivenLogger,
  ) {
    this.settings = settings;
    this.logger = logger;
  }

  /**
   * Verifies that the mount path is usable by the current process.
   *
   * @param mountPath The path the filesystem will be mounted at
   */
  public async assertMountPathIsUsable(mountPath: string) {
    const processUid = process.getuid?.() ?? null;
    const processGid = process.getgid?.() ?? null;

    if (processUid === null || processGid === null) {
      throw new Error(
        dedent`
          Unable to determine process UID or GID.
          This is likely because the process is not running on a Unix-like system, which is not supported.
          VFS cannot be initialised without this information.
        `,
      );
    }

    try {
      const mountPathStats = await stat(mountPath);

      if (!mountPathStats.isDirectory()) {
        throw new Error(
          `VFS mount path "${mountPath}" exists, but is not a directory.`,
        );
      }

      if (mountPathStats.uid !== processUid) {
        throw new Error(
          dedent`
            VFS mount path "${mountPath}" is not owned by the current user.

            Please change the ownership of this directory to the current user by running the following command:

            \`sudo chown ${processUid.toString()} ${mountPath}\`.
          `,
        );
      }
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error)) {
        throw error;
      }

      switch (error.code) {
        case "ENOTCONN": {
          if (!this.settings.vfsForceMount) {
            throw new Error(
              dedent`
                The VFS mount path "${mountPath}" is not accessible. This typically occurs when the mount has become stale due to an unclean shutdown or crash.

                To resolve this issue, try unmounting the VFS mount point by running one of the following commands in your terminal, and then restarting Riven:

                sudo umount -l ${mountPath}
                sudo fusermount -uz ${mountPath}
                sudo fusermount3 -uz ${mountPath}
              `,
              { cause: error },
            );
          }

          break;
        }
        case "ENOENT": {
          throw new Error(
            `VFS mount path "${mountPath}" does not exist. Please create this directory.`,
            { cause: error },
          );
        }
        default: {
          throw error;
        }
      }
    }
  }

  /**
   * Mounts the virtual filesystem.
   *
   * @param mountPath The path to mount the filesystem at
   *
   * @returns The mounted filesystem
   */
  public async mount(mountPath: string): Promise<Fuse> {
    await this.assertMountPathIsUsable(mountPath);

    const vfs = new Fuse(mountPath, fuseOperations, {
      debug: this.settings.vfsDebugLogging,
      allowOther: true,
      defaultPermissions: true as never,
      entryTimeout: 0,
      attrTimeout: 0,
      acAttrTimeout: 0,
      force: this.settings.vfsForceMount,
    });

    await new Promise<void>((resolve, reject) => {
      vfs.mount((error) => {
        if (error) {
          reject(error);

          return;
        }

        resolve();
      });
    });

    this.vfs = vfs;

    return vfs;
  }

  /**
   * Unmounts the virtual filesystem, if one is mounted.
   *
   * @param vfs The filesystem to unmount, defaulting to the mounted one
   */
  public async unmount(vfs: Fuse | undefined = this.vfs) {
    if (!vfs) {
      this.logger.warn("No FUSE VFS instance found to unmount");

      return;
    }

    await new Promise<void>((resolve, reject) => {
      vfs.unmount((error) => {
        if (error) {
          reject(error);

          return;
        }

        resolve();
      });
    });

    this.vfs = undefined;

    await getGlobalDispatcher().destroy();
  }
}

/**
 * Exposes the virtual filesystem to the DI container.
 */
@Module({
  providers: [VfsMountService],
  exports: [VfsMountService],
})
export class VfsModule {}
