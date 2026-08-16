import { Text } from "ink";
import { Tab, Tabs } from "ink-tab";
import { useLocation } from "react-router";

export interface TabBarItem {
  name: string;
  href: string;
}

export interface TabBarProps {
  /** An object in the form `{ label -> href }` */
  items: Record<string, string>;
  onChange: (name: string) => void;
}

export function TabBar({ items, onChange }: TabBarProps) {
  const { pathname } = useLocation();
  const defaultValue =
    Object.entries(items).find(([, href]) => pathname === href)?.[0] ?? "";

  return (
    <Tabs
      showIndex={false}
      onChange={onChange}
      defaultValue={defaultValue}
      colors={{
        activeTab: {
          color: "gray",
        },
      }}
    >
      {Object.entries(items).map(([name, href]) => (
        <Tab key={href} name={name}>
          <Text> {name} </Text>
        </Tab>
      ))}
    </Tabs>
  );
}
