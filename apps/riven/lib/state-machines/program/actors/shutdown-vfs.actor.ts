import { fromPromise } from "xstate";

import { shutdownGrpcVfsServer } from "../../../grpc-vfs-server.ts";

export const shutdownVFS = fromPromise(shutdownGrpcVfsServer);
