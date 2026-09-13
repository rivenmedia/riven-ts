import { TitledBox } from "@mishieck/ink-titled-box";

import type { PropsWithChildren } from "react";

export function PageFooter({ children }: PropsWithChildren) {
  return (
    <TitledBox
      titles={["Navigation"]}
      marginBottom={-1}
      borderStyle="round"
      borderLeft={false}
      borderRight={false}
      borderTop={false}
      borderBottom
      borderDimColor
      paddingX={1}
    >
      {children}
    </TitledBox>
  );
}
