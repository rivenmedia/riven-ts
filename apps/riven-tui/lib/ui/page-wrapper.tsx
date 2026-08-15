import { Box, Text } from "ink";
import assert from "node:assert";

import { useActionsMenuContext } from "./actions-menu/actions-menu-context.tsx";
import { ScrollArea } from "./scroll-area/scroll-area.tsx";

import type { PropsWithChildren, ReactNode } from "react";

interface PageWrapperProps {
  title?: string;
  header?: ReactNode;
  footer?: ReactNode;
  actions?: ReactNode;
}

export function PageWrapper({
  children,
  header,
  title,
  footer,
  actions,
}: PropsWithChildren<PageWrapperProps>) {
  assert.ok(
    header ?? title,
    "PageWrapper requires at least a header or title to be provided.",
  );

  assert.ok(
    !(header && title),
    "PageWrapper cannot have both a header and title at the same time.",
  );

  const { isVisible: showActions } = useActionsMenuContext();

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box borderStyle="round" paddingX={1} borderDimColor>
        {header}
        {title && (
          <Text bold underline>
            {title}
          </Text>
        )}
      </Box>
      <Box flexDirection="column" flexGrow={1} padding={1}>
        <ScrollArea>{children}</ScrollArea>
      </Box>
      {showActions && actions}
      <Box borderStyle="round" borderTop paddingX={1} borderDimColor>
        {footer}
      </Box>
    </Box>
  );
}
