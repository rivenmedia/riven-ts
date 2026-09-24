import { preview } from "@/.storybook/preview";

import { KpiStatTile } from "./kpi-stat-tile";

const meta = preview.meta({
  title: "Dashboard / KpiStatTile",
  component: KpiStatTile,
});

export const Default = meta.story({
  args: {
    title: "Total Items",
    value: "12,483",
  },
});

export const Warning = meta.story({
  args: {
    title: "Incomplete",
    value: "342",
    tone: "warning",
  },
});

export const Row = meta.story({
  render: () => (
    <div className="grid grid-cols-2 gap-x-10 gap-y-4 sm:grid-cols-4">
      <KpiStatTile title="Total Items" value="12,483" />
      <KpiStatTile title="Completed" value="11,891" />
      <KpiStatTile title="Incomplete" value="342" tone="warning" />
      <KpiStatTile title="Completion Rate" value="95.25%" />
    </div>
  ),
});
