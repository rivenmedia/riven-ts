# @repo/util-ui

Shared frontend kit for the Riven frontend and plugin pages: design system components (atoms and molecules), the GraphQL client, and UI utilities.

Components are consumed as source and bundled by the frontend, e.g.

```tsx
import { Button } from "@repo/util-ui/components/_ui/button.tsx";
```

Stories for these components live in `apps/frontend`, alongside its Storybook setup and visual baselines.
