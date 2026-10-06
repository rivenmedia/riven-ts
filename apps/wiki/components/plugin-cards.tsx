import { Card, Cards } from "fumadocs-ui/components/card";

import { getPlugins } from "#lib/plugins.ts";

export function PluginCards() {
  return (
    <Cards>
      {getPlugins().map((plugin) => (
        <Card
          key={plugin.name}
          title={plugin.title}
          href={plugin.url}
          description={plugin.description}
        />
      ))}
    </Cards>
  );
}
