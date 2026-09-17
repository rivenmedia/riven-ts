import { Text } from "ink";
import { Tab, Tabs } from "ink-tab";
import { useLocation } from "react-router";

import { useActionsMenuContext } from "../actions-menu/actions-menu-context.tsx";

export interface TabData {
  label: string;
  isHidden?: boolean;
}

export interface TabBarProps {
  /** An object in the form `{ label -> href }` */
  items: Record<string, TabData>;
  onChange: (name: string) => void;
}

export function getActiveTabPath(
  items: Record<string, TabData>,
  pathname: string,
): string | undefined {
  const hrefs = Object.keys(items);

  if (hrefs.includes(pathname)) {
    return pathname;
  }

  return hrefs
    .filter((href) => pathname.startsWith(`${href}/`))
    .toSorted((a, b) => b.length - a.length)[0];
}

export function TabBar({ items, onChange }: TabBarProps) {
  const { pathname } = useLocation();
  const defaultValue = getActiveTabPath(items, pathname) ?? "";

  const { isVisible: isActionsMenuVisible } = useActionsMenuContext();

  return (
    <Tabs
      key={`${pathname}:tabs`}
      isFocused={!isActionsMenuVisible}
      showIndex={false}
      onChange={onChange}
      defaultValue={defaultValue}
      colors={{
        activeTab: {
          color: "gray",
        },
      }}
    >
      {Object.entries(items).map(([href, { label }]) => (
        <Tab key={href} name={href}>
          <Text> {label} </Text>
        </Tab>
      ))}
    </Tabs>
  );
}
