import { TitledBox } from "@mishieck/ink-titled-box";
import { useLocation } from "react-router";

import { settings } from "../../../settings.ts";

import type { PropsWithChildren } from "react";

export interface PageHeaderProps {
  title: string;
}

export function PageHeader({
  children,
  title,
}: PropsWithChildren<PageHeaderProps>) {
  const { pathname } = useLocation();

  return (
    <TitledBox
      titles={[
        title,
        ...(settings.RIVEN_TUI_SETTING__enableDebug ? [pathname] : []),
      ]}
      titleJustify="space-between"
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
