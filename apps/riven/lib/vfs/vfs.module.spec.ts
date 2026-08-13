import { Test } from "@nestjs/testing";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it as baseIt, vi } from "vitest";

import { AppModule } from "../app.module.ts";
import { VfsMountService } from "./vfs.module.ts";

/**
 * Covers the mount path preflight checks, which previously lived inside an
 * XState actor and so could not be exercised without mounting a real
 * filesystem.
 */
const it = baseIt
  .extend("tempDir", async ({}, { onCleanup }) => {
    const directory = await mkdtemp(path.join(tmpdir(), "riven-vfs-test-"));

    onCleanup(async () => {
      await rm(directory, { recursive: true, force: true });
    });

    return directory;
  })
  .extend("vfsMountService", async ({}, { onCleanup }) => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    onCleanup(async () => {
      await module.close();
    });

    return module.get(VfsMountService);
  });

describe("the mount path preflight checks", () => {
  it("accepts a directory owned by the current user", async ({
    tempDir,
    vfsMountService,
  }) => {
    await expect(
      vfsMountService.assertMountPathIsUsable(tempDir),
    ).resolves.toBeUndefined();
  });

  it("rejects a path that does not exist", async ({
    tempDir,
    vfsMountService,
  }) => {
    await expect(
      vfsMountService.assertMountPathIsUsable(path.join(tempDir, "missing")),
    ).rejects.toThrow(/does not exist/u);
  });

  it("rejects a path that is not a directory", async ({
    tempDir,
    vfsMountService,
  }) => {
    const filePath = path.join(tempDir, "a-file");

    await writeFile(filePath, "");

    await expect(
      vfsMountService.assertMountPathIsUsable(filePath),
    ).rejects.toThrow(/is not a directory/u);
  });

  // Riven cannot decide whether it owns the mount point without them, which
  // happens on platforms that do not implement them.
  it("rejects a process with no resolvable UID or GID", async ({
    tempDir,
    vfsMountService,
  }) => {
    // @ts-expect-error - Simulating a platform where these are unavailable.
    vi.spyOn(process, "getuid", "get").mockReturnValue(undefined);
    // @ts-expect-error - Simulating a platform where these are unavailable.
    vi.spyOn(process, "getgid", "get").mockReturnValue(undefined);

    await expect(
      vfsMountService.assertMountPathIsUsable(tempDir),
    ).rejects.toThrow(/unable to determine process uid or gid/iu);
  });

  it("rejects a directory owned by another user", async ({
    tempDir,
    vfsMountService,
  }) => {
    const processUid = process.getuid?.() ?? 0;

    vi.spyOn(process, "getuid").mockReturnValue(processUid + 1);

    await expect(
      vfsMountService.assertMountPathIsUsable(tempDir),
    ).rejects.toThrow(/is not owned by the current user/u);
  });
});

describe("unmounting", () => {
  it("does nothing when no filesystem is mounted", async ({
    vfsMountService,
  }) => {
    await expect(vfsMountService.unmount()).resolves.toBeUndefined();
  });
});
