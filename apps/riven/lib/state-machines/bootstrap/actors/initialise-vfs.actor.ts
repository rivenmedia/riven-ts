import { fromPromise } from "xstate";

import { initializeGrpcVfsServer } from "../../../grpc-vfs-server.ts";

export const initialiseVFS = fromPromise(initializeGrpcVfsServer);
