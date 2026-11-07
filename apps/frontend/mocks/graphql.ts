import { graphql } from "msw/graphql";

// Matches any origin, as queries go to `BACKEND_URL` but subscriptions connect via the frontend's own origin
export const api = graphql.link(/\/graphql$/u);
