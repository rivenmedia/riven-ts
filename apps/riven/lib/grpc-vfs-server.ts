import {
  RivenVFSServiceDefinition,
  type RivenVFSServiceImplementation,
  StreamFileResponse,
  type SyncFilesResponse,
} from "@repo/feature-vfs";

import { createServer } from "nice-grpc";

const vfsImpl = {
  async *streamFile(request, context): AsyncIterable<StreamFileResponse> {
    console.log(request, context);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    yield {
      chunkNumber: 1,
      chunkOffset: 0,
      data: Buffer.from("Hello, world! This is a test file from Riven VFS."),
      isFinal: true,
      totalSize: 43,
    };
  },
  async *syncFiles(request, context): AsyncIterable<SyncFilesResponse> {
    console.log("SyncFiles request received:", request, context);

    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 5000));

      yield {
        files: [
          {
            itemId: 1,
            fileSize: 1234,
            fileName: "example1.txt",
            fileUrl: "http://example.com/example1.txt",
          },
          {
            itemId: 2,
            fileSize: 1234,
            fileName: "example2.txt",
            fileUrl: "http://example.com/example2.txt",
          },
        ],
      };
    }
  },
} satisfies RivenVFSServiceImplementation;

const server = createServer({
  "grpc.keepalive_permit_without_calls": 1,
});

server.add(RivenVFSServiceDefinition, vfsImpl);

export async function initializeGrpcVfsServer() {
  await server.listen("localhost:50051");
}

export async function shutdownGrpcVfsServer() {
  await server.shutdown();
}
