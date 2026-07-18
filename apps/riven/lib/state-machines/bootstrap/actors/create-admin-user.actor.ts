import { fromPromise } from "xstate";

import type { Services } from "../../../database/database.ts";

export interface CreateAdminUserInput {
  services: Services;
  username: string;
  password: string;
}

export const createAdminUser = fromPromise<undefined, CreateAdminUserInput>(
  async ({ input: { services, username, password } }) => {
    await services.authService.createAdminUser({ username, password });
  },
);
