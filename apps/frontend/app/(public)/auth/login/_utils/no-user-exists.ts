"use server";

import { getUsersCount } from "@/lib/database/functions/get-users-count";

export async function noUserExists() {
  const count = await getUsersCount();

  return count === 0;
}
