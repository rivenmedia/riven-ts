import { prerenderStatic } from "@apollo/client/react/ssr";
import React from "react";
import { prerenderToNodeStream } from "react-dom/static";
import { Arg, Query, Resolver } from "type-graphql";

import type { ComponentType } from "react";

@Resolver()
// oxlint-disable-next-line react/prefer-function-component
export class UiResolver {
  @Query(() => String)
  public async pluginPage(
    @Arg("name") name: string,
    @Arg("route", () => String) route: string,
  ): Promise<string> {
    const { default: Page } = (await import(
      `@repo/plugin-${name}/ui/${route}/page.tsx`
    )) as { default: ComponentType };

    const { result } = await prerenderStatic({
      tree: <Page />,
      renderFunction: prerenderToNodeStream,
    });

    return result;
  }
}
