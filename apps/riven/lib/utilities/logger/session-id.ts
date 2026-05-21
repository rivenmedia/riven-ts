import { getEnvironmentData } from "worker_threads";
import z from "zod";

export const SessionID = z.uuidv4().brand<"SessionID">();

export type SessionID = z.infer<typeof SessionID>;

export function getSessionId() {
  return SessionID.parse(getEnvironmentData("riven.session.id"));
}
