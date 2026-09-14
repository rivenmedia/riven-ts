import { useApp, useInput } from "ink";
import { useNavigate } from "react-router";

import { Routes } from "./routes.tsx";
import { Screen } from "./ui/screen.tsx";
import { SuspenseBoundary } from "./ui/suspense-boundary.tsx";
import { useIsTextEntryFocused } from "./ui/text-entry.tsx";

export function App() {
  const { exit } = useApp();
  const navigate = useNavigate();
  const isTextEntryFocused = useIsTextEntryFocused();

  useInput((input) => {
    if (input.toLowerCase() === "q" && !isTextEntryFocused) {
      exit();
    }
  });

  return (
    <Screen>
      <SuspenseBoundary
        onBack={() => {
          void navigate(-1);
        }}
      >
        <Routes />
      </SuspenseBoundary>
    </Screen>
  );
}
