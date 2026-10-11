import type { authClient } from "./client.ts";

export type User = (typeof authClient)["$Infer"]["Session"]["user"];
