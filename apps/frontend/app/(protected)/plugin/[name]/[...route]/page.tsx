import { gql } from "@apollo/client";
import { notFound } from "next/navigation";

import { query } from "#lib/graphql/client.ts";

import type {
  GetPluginPageQuery,
  GetPluginPageQueryVariables,
} from "./page.typegen";
import type { TypedDocumentNode } from "@apollo/client";

const GET_PLUGIN_PAGE: TypedDocumentNode<
  GetPluginPageQuery,
  GetPluginPageQueryVariables
> = gql`
  query GetPluginPage($name: String!, $route: String!) {
    pluginPage(name: $name, route: $route)
  }
`;

export default async function PluginRoutePage({
  params,
}: PageProps<"/plugin/[name]/[...route]">) {
  const { name, route } = await params;

  try {
    const { data } = await query({
      query: GET_PLUGIN_PAGE,
      variables: {
        name,
        route: route.join("/"),
      },
    });

    if (!data?.pluginPage) {
      notFound();
    }

    // oxlint-disable-next-line react/no-danger
    return <div dangerouslySetInnerHTML={{ __html: data.pluginPage }} />;
  } catch {
    notFound();
  }
}

export const instant = false;
