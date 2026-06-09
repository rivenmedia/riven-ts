import assert from "node:assert";
import { AsyncLocalStorage } from "node:async_hooks";
import { Buffer } from "node:buffer";

import type { FileHandleMetadata } from "./file-handle-map.ts";
import type { Promisable } from "type-fest";
import type { Dispatcher } from "undici";

export type VfsOperationContext = (
  | {
      operationName: "open";
      flags: number;
    }
  | {
      operationName: "release";
      fd: number;
    }
  | {
      operationName: "read";
      fd: number;
      position: number;
      length: number;
      buffer: Buffer;
      context: {
        fileHandleMetadata: FileHandleMetadata;
        previousReadPosition: number | undefined;
        readonly currentStreamPosition: number | undefined;
        responsePromise: Promise<Dispatcher.ResponseData> | undefined;
        seekController: AbortController;
      };
    }
  | {
      operationName: "getattr" | "readdir";
    }
) & {
  path: string;
};

const vfsOperationContext = new AsyncLocalStorage<VfsOperationContext>();

export function withVfsOperationContext<T extends () => Promisable<unknown>>(
  context: VfsOperationContext,
  callback: T,
) {
  return vfsOperationContext.run<unknown>(context, callback) as ReturnType<T>;
}

export function getVfsOperationContext<
  T extends VfsOperationContext["operationName"],
>(operationName?: T): Extract<VfsOperationContext, { operationName: T }> {
  const context = vfsOperationContext.getStore();

  if (!context) {
    throw new Error("No VFS operation context available");
  }

  if (operationName) {
    assert(
      context.operationName === operationName,
      `VFS operation context mismatch: expected ${operationName} but got ${context.operationName}`,
    );
  }

  return context as Extract<VfsOperationContext, { operationName: T }>;
}
