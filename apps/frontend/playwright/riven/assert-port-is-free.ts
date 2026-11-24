import { createServer } from "node:net";

const isAddressInUse = (error: unknown) =>
  error instanceof Error && "code" in error && error.code === "EADDRINUSE";

/**
 * Fails if something is already listening on `host:port`.
 *
 * A Riven orphaned by a killed worker keeps its port, and would answer the next run's readiness checks in place of
 * the Riven that run starts.
 */
export async function assertPortIsFree(port: number, host = "127.0.0.1") {
  const server = createServer();

  try {
    await new Promise<void>((resolve, reject) => {
      server.once("error", reject);
      server.listen(port, host, resolve);
    });
  } catch (error) {
    if (isAddressInUse(error)) {
      throw new Error(
        `Port ${String(port)} is already in use, probably by a Riven left behind by an aborted run. Stop it (e.g. \`kill $(lsof -t -i :${String(port)})\`), then run the tests again.`,
        { cause: error },
      );
    }

    throw error;
  }

  await new Promise((resolve) => {
    server.close(resolve);
  });
}
