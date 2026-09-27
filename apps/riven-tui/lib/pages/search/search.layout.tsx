import { useSuspenseQuery } from "@apollo/client/react";
import { Text } from "ink";
import { Outlet } from "react-router";

import { PageWrapper } from "../../ui/page-wrapper/page-wrapper.tsx";
import { getLibraryTabs } from "../library/library-tabs.ts";
import { GET_LIBRARY_ITEM_COUNTS } from "../library/queries/get-library-item-counts.query.ts";

export function SearchScreenLayout() {
  const { data } = useSuspenseQuery(GET_LIBRARY_ITEM_COUNTS, {});

  return (
    <PageWrapper
      header={{ title: "Search" }}
      footer={
        <Text dimColor>
          [/] focus search · [enter] select · [esc] back · [q]uit
        </Text>
      }
      tabs={getLibraryTabs(data)}
    >
      <Outlet />
    </PageWrapper>
  );
}
