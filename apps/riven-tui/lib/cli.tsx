import { withFullScreen } from "fullscreen-ink";

import { App } from "./app.tsx";
import { Providers } from "./providers.tsx";

const ink = withFullScreen(
  <Providers>
    <App />
  </Providers>,
);

await ink.start();
