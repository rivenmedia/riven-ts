import { getPlugins } from "@/lib/plugins";

import { Card, Cards } from "fumadocs-ui/components/card";

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
