import { Route, Routes as ReactRouterRoutes } from "react-router";

import { ItemDetailPageLayout } from "./pages/item-detail/item-detail.layout.tsx";
import { ItemDetailActiveStreamScreen } from "./pages/item-detail/screens/active-stream.tsx";
import { ItemDetailChildrenTab } from "./pages/item-detail/screens/children.tsx";
import { ItemDetailFilesScreen } from "./pages/item-detail/screens/files.tsx";
import { ItemDetailOverviewTab } from "./pages/item-detail/screens/overview.tsx";
import { ItemDetailProcessingDataScreen } from "./pages/item-detail/screens/processing-data.tsx";
import { ItemDetailStreamsScreen } from "./pages/item-detail/screens/streams.tsx";
import { ItemDetailSubtitlesScreen } from "./pages/item-detail/screens/subtitles.tsx";
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
        <Route path="files" element={<ItemDetailFilesScreen />} />
        <Route path="subtitles" element={<ItemDetailSubtitlesScreen />} />
        <Route path="streams" element={<ItemDetailStreamsScreen />} />
        <Route
          path="processing-data"
          element={<ItemDetailProcessingDataScreen />}
        />
        <Route
          path="active-stream"
          element={<ItemDetailActiveStreamScreen />}
        />
      </Route>
    </ReactRouterRoutes>
  );
}
