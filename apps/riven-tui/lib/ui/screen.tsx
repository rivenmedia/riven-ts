import { Box } from "ink";

import type { PropsWithChildren } from "react";

export function Screen({ children }: PropsWithChildren) {
  return (
    <Box flexGrow={1} borderDimColor borderStyle="round">
      {children}
    </Box>
  );
}
