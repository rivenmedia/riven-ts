import { useApp, useInput } from "ink";
import { Route, Routes, useNavigate } from "react-router";

import { ItemDetailPageLayout } from "../pages/item-detail/item-detail.layout.tsx";
import { ItemDetailChildrenTab } from "../pages/item-detail/tabs/children.tsx";
import { ItemDetailOverviewTab } from "../pages/item-detail/tabs/overview.tsx";
import { LibraryScreen } from "../pages/library/library.page.tsx";
import { Screen } from "./screen.tsx";
import { SuspenseBoundary } from "./suspense-boundary.tsx";

export function App() {
  const { exit } = useApp();
  const navigate = useNavigate();

  useInput((input) => {
    if (input === "q") {
      exit();
    }
  });

  return (
    <SuspenseBoundary
      onBack={() => {
        void navigate(-1);
      }}
    >
      <Screen>
        <Routes>
          <Route path="library" element={<LibraryScreen />}>
            <Route path="type/:type" element={<LibraryScreen />} />
          </Route>
          <Route path="item/:id" element={<ItemDetailPageLayout />}>
            <Route index element={<ItemDetailOverviewTab />} />
            <Route path="children" element={<ItemDetailChildrenTab />} />
          </Route>
        </Routes>
      </Screen>
    </SuspenseBoundary>
  );
}
