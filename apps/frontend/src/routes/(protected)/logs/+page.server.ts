import { requireSettingsAccess } from "$lib/server/rbac";

import type { PageServerLoad } from "./$types";

export const load = (async ({ locals }) => {
  requireSettingsAccess(locals.user);
  return {};
}) satisfies PageServerLoad;
