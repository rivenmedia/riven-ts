import { ItemGrid } from "#components/item-grid/item-grid.tsx";

export default function ExploreLayout({ children }: LayoutProps<"/explore">) {
  return <ItemGrid>{children}</ItemGrid>;
}
