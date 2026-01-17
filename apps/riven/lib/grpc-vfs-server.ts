import {
  type FileEntry,
  RivenVFSServiceDefinition,
  type RivenVFSServiceImplementation,
  StreamFileResponse,
  type WatchCatalogRequest,
  type WatchCatalogResponse,
  WatchCatalogResponse_UpdateType,
} from "@repo/feature-vfs";

import { createServer } from "nice-grpc";

// Track connected catalog watchers
const catalogWatchers = new Map<
  string,
  {
    daemonId: string;
    response: AsyncIterable<WatchCatalogRequest>;
  }
>();

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

  async *watchCatalog(
    request: AsyncIterable<WatchCatalogRequest>,
    _context,
  ): AsyncIterable<WatchCatalogResponse> {
    const daemonId = "unknown";

    let updateId = 0;
    let updaterInterval: NodeJS.Timeout | undefined;

    const newItems: FileEntry[] = [];
    const itemsToDelete: FileEntry[] = [];

    async function listen() {
      for await (const command of request) {
        console.log(command);

        switch (command.command?.$case) {
          case "ack": {
            console.log(
              `Daemon ${daemonId} acknowledged update ${command.command.ack.updateId.toString()}`,
            );

            break;
          }
          case "subscribe": {
            const { daemonId, version } = command.command.subscribe;

            console.log(
              `Daemon ${daemonId} subscribed to catalog (version ${version.toString()})`,
            );

            updaterInterval ??= setInterval(() => {
              const newItemCount = Math.floor(Math.random() * 3);

              newItems.push(
                ...Array.from({ length: newItemCount }).map(() => {
                  const fileId = Math.floor(Math.random() * 10000);

                  return {
                    id: fileId,
                    mimeType: "application/octet-stream",
                    name: `file_${fileId.toString()}.txt`,
                    size: 1024,
                    url: `http://example.com/file_${fileId.toString()}.txt`,
                    modifiedTime: Date.now(),
                  };
                }),
              );

              itemsToDelete.push(...newItems);

              console.log(
                `Added ${newItemCount.toString()} new items to catalog`,
              );
            }, 5000);

            // Register this watcher
            catalogWatchers.set(daemonId, { daemonId, response: request });

            break;
          }
        }
      }
    }

    void listen();

    // Process incoming commands from daemon
    while (true) {
      console.log("New items:", newItems);
      if (!newItems.length && !itemsToDelete.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }

      updateId += 1;

      const rand = Math.random();
      console.log(rand, itemsToDelete);

      if (rand < 0.4 && itemsToDelete.length) {
        const files = itemsToDelete.splice(0, itemsToDelete.length);

        yield {
          files,
          type: WatchCatalogResponse_UpdateType.UPDATE_TYPE_REMOVE,
          updateId,
        };
      } else {
        const files = newItems.splice(0, newItems.length);

        yield {
          files,
          type: WatchCatalogResponse_UpdateType.UPDATE_TYPE_ADD,
          updateId,
        };
      }
    }

    console.log(`Daemon ${daemonId} disconnected from catalog watch`);

    catalogWatchers.delete(daemonId);
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
