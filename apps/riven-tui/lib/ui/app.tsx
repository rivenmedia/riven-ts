import { useApp, useInput } from "ink";
import { Route, Routes, useNavigate } from "react-router";

import { ItemDetailScreen } from "../pages/item-detail/item-detail.page.tsx";
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
          <Route
            path="/"
            element={
              <LibraryScreen
                onSelectItem={(id) => {
                  void navigate(`/item/${id}`);
                }}
              />
            }
          />
          <Route
            path="/item/:id"
            element={
              <ItemDetailScreen
                onBack={() => {
                  void navigate(-1);
                }}
                onSelectChild={(id) => {
                  void navigate(`/item/${id}`);
                }}
              />
            }
          />
        </Routes>
      </Screen>
    </SuspenseBoundary>
  );
}
