import { HttpResponse } from "msw";

import { INSTANCE_RESTART_STATUS } from "#app/(protected)/settings/_components/restart-banner/_queries/instance-restart-status.query.ts";
import { GET_INSTANCE_SETUP_REQUIRED } from "#app/_queries/get-instance-setup-required.query.ts";
import { api } from "#mocks/graphql.ts";

export const createInstanceSetupRequiredHandler = (setupRequired: boolean) =>
  api.query(GET_INSTANCE_SETUP_REQUIRED, () =>
    HttpResponse.json({
      data: {
        instanceStatus: {
          __typename: "InstanceStatus",
          setupRequired,
        },
      },
    }),
  );

export const createInstanceRestartStatusHandler = (restartRequired: boolean) =>
  api.query(INSTANCE_RESTART_STATUS, () =>
    HttpResponse.json({
      data: {
        instanceStatus: {
          __typename: "InstanceStatus",
          restartRequired,
        },
      },
    }),
  );
