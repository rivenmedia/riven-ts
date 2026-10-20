import { graphql } from "msw/graphql";

import { privateEnvironment } from "#environment/private-environment.schema.ts";

export const api = graphql.link(`${privateEnvironment.BACKEND_URL}/graphql`);
