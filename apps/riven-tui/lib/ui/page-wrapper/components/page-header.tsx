import { TitledBox } from "@mishieck/ink-titled-box";

import type { PropsWithChildren } from "react";

export interface PageHeaderProps {
  title: string;
}

export function PageHeader({
  children,
  title,
}: PropsWithChildren<PageHeaderProps>) {
  return (
    <TitledBox
      titles={[title]}
      marginTop={-1}
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
