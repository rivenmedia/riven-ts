import z from "zod";

import type { UUID as CryptoUUID } from "crypto";

export const UUID = z.uuidv4().pipe(z.custom<CryptoUUID>());
