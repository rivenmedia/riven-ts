import { graphql } from "msw/graphql";

// Matches any origin, as server queries go to `BACKEND_URL` but the browser connects via the frontend's own origin
export const api = graphql.link(/\/graphql$/u);
