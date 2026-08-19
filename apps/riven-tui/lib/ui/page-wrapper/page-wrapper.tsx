import { Box } from "ink";
import { useLocation, useNavigate } from "react-router";

import { useActionsMenuContext } from "../actions-menu/actions-menu-context.tsx";
import { ScrollArea } from "../scroll-area/scroll-area.tsx";
import { TabBar } from "../tab-bar/tab-bar.tsx";
import { PageFooter } from "./components/page-footer.tsx";
import { PageHeader } from "./components/page-header.tsx";

import type { TabBarProps } from "../tab-bar/tab-bar.tsx";
import type { PropsWithChildren, ReactNode } from "react";

interface PageWrapperProps {
  title?: string;
  header: {
    title: string;
    content?: ReactNode;
  };
  footer?: ReactNode;
  actions?: ReactNode;
  tabs?: TabBarProps["items"];
}

export function PageWrapper({
  children,
  header,
  footer,
  tabs,
  actions,
}: PropsWithChildren<PageWrapperProps>) {
  const { pathname } = useLocation();
  const { isVisible: showActions } = useActionsMenuContext();
  const navigate = useNavigate();

  const visibleTabs = Object.fromEntries(
    tabs ? Object.entries(tabs).filter(([, { isHidden }]) => !isHidden) : [],
  );

  return (
    <Box flexDirection="column" flexGrow={1}>
      <PageHeader title={header.title}>{header.content}</PageHeader>
      {Object.keys(visibleTabs).length > 1 && (
        <Box
          paddingX={1}
          borderStyle="round"
          borderDimColor
          borderTop={false}
          borderLeft={false}
          borderRight={false}
        >
          <TabBar
            items={visibleTabs}
            onChange={(href) => {
              if (!visibleTabs[href]) {
                throw new Error(`Could not find tab with name "${href}"`);
              }

              void navigate(href, { replace: true });
            }}
          />
        </Box>
      )}
      <Box flexDirection="column" flexGrow={1} padding={1} paddingTop={0}>
        <ScrollArea id={pathname}>{children}</ScrollArea>
      </Box>
      {showActions && actions}
      <PageFooter>{footer}</PageFooter>
    </Box>
  );
}
