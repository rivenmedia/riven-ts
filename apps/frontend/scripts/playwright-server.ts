/**
 * Runs the browser for visual tests inside the pinned Playwright container,
 * so snapshots render identically on CI and on every developer machine.
 *
 * Usage:
 *   node scripts/playwright-server.ts start              Starts the server and prints `VIS_BROWSER_WS_ENDPOINT=<url>`
 *   node scripts/playwright-server.ts run -- <command>   Runs a command against the server, then stops it
 */
import { execFile, spawn } from "node:child_process";
import { once } from "node:events";
import { createRequire } from "node:module";
import { setTimeout as sleep } from "node:timers/promises";

const require = createRequire(import.meta.url);
const { version } = require("playwright/package.json") as { version: string };

const containerPort = 3000;
const pollIntervalMs = 500;
const startupTimeoutMs = 120_000;

const docker = async (...args: string[]) =>
  new Promise<string>((resolve, reject) => {
    execFile("docker", args, { encoding: "utf8" }, (error, stdout) => {
      if (error) {
        reject(new Error(`docker ${args.join(" ")} failed`, { cause: error }));
        return;
      }

      resolve(stdout.trim());
    });
  });

const startServer = async () => {
  const containerId = await docker(
    "run",
    "--detach",
    "--rm",
    "--init",
    // Pinned to x64 to match the CI runners, as Chromium's rendering can differ between architectures
    "--platform=linux/amd64",
    // Let Docker pick a free host port, bound to loopback only
    `--publish=127.0.0.1::${containerPort.toString()}`,
    `mcr.microsoft.com/playwright:v${version}-noble`,
    "npx",
    "--yes",
    `playwright@${version}`,
    "run-server",
    `--port=${containerPort.toString()}`,
    "--host=0.0.0.0",
  );

  // Docker accepts connections on the published port before the server is listening, so wait for the log line instead
  for (let waited = 0; waited < startupTimeoutMs; waited += pollIntervalMs) {
    const logs = await docker("logs", containerId);

    if (logs.includes("Listening on")) {
      const hostAddress = await docker(
        "port",
        containerId,
        containerPort.toString(),
      );

      return { containerId, wsEndpoint: `ws://${hostAddress}/` };
    }

    await sleep(pollIntervalMs);
  }

  await docker("rm", "--force", containerId);

  throw new Error("Timed out waiting for the Playwright server to start");
};

/** Writes to stdout, as the output of `start` is appended to `$GITHUB_ENV` */
const print = (text: string) => {
  process.stdout.write(`${text}\n`);
};

const [mode, ...rest] = process.argv.slice(2);

if (mode === "start") {
  const { wsEndpoint } = await startServer();

  print(`VIS_BROWSER_WS_ENDPOINT=${wsEndpoint}`);
} else if (mode === "run") {
  const [command, ...args] = rest[0] === "--" ? rest.slice(1) : rest;

  if (!command) {
    throw new Error("Usage: playwright-server.ts run -- <command> [...args]");
  }

  const { containerId, wsEndpoint } = await startServer();

  print(
    `Playwright ${version} server running in container ${containerId.slice(0, 12)} at ${wsEndpoint}`,
  );

  const child = spawn(command, args, {
    stdio: "inherit",
    env: { ...process.env, VIS_BROWSER_WS_ENDPOINT: wsEndpoint },
  });

  // Lets the command shut down cleanly, so the container is always removed
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.on(signal, () => {
      child.kill(signal);
    });
  }

  const [code, signal] = (await once(child, "exit")) as [
    number | null,
    NodeJS.Signals | null,
  ];

  await docker("rm", "--force", containerId);

  process.exitCode = code ?? (signal ? 1 : 0);
} else {
  throw new Error(`Unknown mode "${mode ?? ""}". Expected "start" or "run".`);
}
