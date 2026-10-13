import { Skeleton } from "@repo/util-ui/components/_ui/skeleton.tsx";

import { notFound } from "next/navigation";
import { Suspense } from "react";

import { resolvePluginPage } from "#lib/plugins/resolve-plugin-page.ts";

type PluginRoutePageProps = PageProps<"/plugin/[name]/[[...route]]">;

async function PluginPage({ params, searchParams }: PluginRoutePageProps) {
  const { name, route = [] } = await params;
  const resolvedPage = await resolvePluginPage(name, route);

  if (!resolvedPage) {
    notFound();
  }

  const Page = await resolvedPage.page.load();

  return (
    <Page
      params={Promise.resolve(resolvedPage.params)}
      searchParams={searchParams}
    />
  );
}

function PluginPageSkeleton() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      <Skeleton className="h-10 w-1/3" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/**
 * Renders pages provided by plugins at `/plugin/{name}/{...route}`.
 *
 * @see {@link resolvePluginPage}
 */
export default function PluginRoutePage(props: PluginRoutePageProps) {
  return (
    <Suspense fallback={<PluginPageSkeleton />}>
      <PluginPage {...props} />
    </Suspense>
  );
}
