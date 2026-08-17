import { Text } from "ink";
import { Outlet } from "react-router";

import { PageWrapper } from "../../ui/page-wrapper/page-wrapper.tsx";
import { SuspenseBoundary } from "../../ui/suspense-boundary.tsx";

export function LibraryScreenLayout() {
  return (
    <PageWrapper
      header={{
        title: "Media Library",
        // content: (
        //   <Text dimColor>
        //     {data.mediaItems.length} item
        //     {data.mediaItems.length === 1 ? "" : "s"}
        //   </Text>
        // ),
      }}
      footer={
        <Text dimColor>
          [↑/↓] navigate · [enter] view · [r] refresh · [q] quit
        </Text>
      }
      tabs={{
        "/library": {
          label: "All",
        },
        "/library/type/movie": {
          label: "Movies",
        },
        "/library/type/show": {
          label: "Shows",
        },
      }}
    >
      <SuspenseBoundary>
        <Outlet />
      </SuspenseBoundary>
    </PageWrapper>
  );
}
