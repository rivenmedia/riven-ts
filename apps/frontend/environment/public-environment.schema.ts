import { z } from "zod";

export const publicEnvironment = z.object({}).parse(process.env);
