#!/usr/bin/env node

import { withFullScreen } from "fullscreen-ink";

import { Providers } from "./providers.tsx";
import { App } from "./ui/app.tsx";

const ink = withFullScreen(
  <Providers>
    <App />
  </Providers>,
);

await ink.start();
