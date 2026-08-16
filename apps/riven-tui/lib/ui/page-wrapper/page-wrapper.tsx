import { Box } from "ink";

import { useActionsMenuContext } from "../actions-menu/actions-menu-context.tsx";
import { ScrollArea } from "../scroll-area/scroll-area.tsx";
import { PageFooter } from "./components/page-footer.tsx";
import { PageHeader } from "./components/page-header.tsx";

import type { PropsWithChildren, ReactNode } from "react";

interface PageWrapperProps {
  title?: string;
  header: {
    title: string;
    content?: ReactNode;
  };
  footer?: ReactNode;
  actions?: ReactNode;
}

export function PageWrapper({
  children,
  header,
  footer,
  actions,
}: PropsWithChildren<PageWrapperProps>) {
  const { isVisible: showActions } = useActionsMenuContext();

  return (
    <Box flexDirection="column" flexGrow={1}>
      <PageHeader title={header.title}>{header.content}</PageHeader>
      <Box flexDirection="column" flexGrow={1} padding={1}>
        <ScrollArea>{children}</ScrollArea>
      </Box>
      {showActions && actions}
      <PageFooter>{footer}</PageFooter>
    </Box>
  );
}
