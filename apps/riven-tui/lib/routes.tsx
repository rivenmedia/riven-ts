import { Route, Routes as ReactRouterRoutes } from "react-router";

import { ItemDetailPageLayout } from "./pages/item-detail/item-detail.layout.tsx";
import { ItemDetailChildrenTab } from "./pages/item-detail/screens/children.tsx";
import { ItemDetailOverviewTab } from "./pages/item-detail/screens/overview.tsx";
import { LibraryScreenLayout } from "./pages/library/library.layout.tsx";
import { LibraryScreenIndexScreen } from "./pages/library/screens/index.tsx";

export function Routes() {
  return (
    <ReactRouterRoutes>
      <Route path="library" element={<LibraryScreenLayout />}>
        <Route index element={<LibraryScreenIndexScreen />} />
        <Route path="type/:type" element={<LibraryScreenIndexScreen />} />
      </Route>
      <Route path="item/:id" element={<ItemDetailPageLayout />}>
        <Route index element={<ItemDetailOverviewTab />} />
        <Route path="children" element={<ItemDetailChildrenTab />} />
      </Route>
    </ReactRouterRoutes>
  );
}
