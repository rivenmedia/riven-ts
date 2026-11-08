import { graphql } from "msw/graphql";

export const api = graphql.link(/\/graphql$/u);
