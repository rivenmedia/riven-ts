import { orm } from "..";
import { user } from "../schema";

export async function getUsersCount() {
  return await orm.$count(user);
}
