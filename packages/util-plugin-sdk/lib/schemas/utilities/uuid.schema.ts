import z from "zod";

import type { UUID as CryptoUUID } from "node:crypto";

export const UUID = z.uuidv4().pipe(z.custom<CryptoUUID>());
