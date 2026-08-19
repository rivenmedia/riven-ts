import { Text } from "ink";
import { Tab, Tabs } from "ink-tab";
import { useLocation } from "react-router";

import { useActionsMenuContext } from "../actions-menu/actions-menu-context.tsx";

interface TabData {
  label: string;
  isHidden?: boolean;
}

export interface TabBarProps {
  /** An object in the form `{ label -> href }` */
  items: Record<string, TabData>;
  onChange: (name: string) => void;
}

export function TabBar({ items, onChange }: TabBarProps) {
  const { pathname } = useLocation();
  const defaultValue =
    Object.keys(items).find((href) => pathname === href) ?? "";

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
