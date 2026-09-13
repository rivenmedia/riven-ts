import { useApp, useInput } from "ink";
import { useNavigate } from "react-router";

import { Routes } from "./routes.tsx";
import { Screen } from "./ui/screen.tsx";
import { SuspenseBoundary } from "./ui/suspense-boundary.tsx";

export function App() {
  const { exit } = useApp();
  const navigate = useNavigate();

  useInput((input) => {
    if (input.toLowerCase() === "q") {
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
