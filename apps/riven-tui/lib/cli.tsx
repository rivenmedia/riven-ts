#!/usr/bin/env node

import { withFullScreen } from "fullscreen-ink";
import { StrictMode } from "react";

import { App } from "./app.tsx";
import { Providers } from "./providers.tsx";

const ink = withFullScreen(
  <StrictMode>
    <Providers>
      <App />
    </Providers>
  </StrictMode>,
);

await ink.start();
