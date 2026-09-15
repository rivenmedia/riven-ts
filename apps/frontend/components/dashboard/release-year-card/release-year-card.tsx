import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/_ui/chart";

import { XAxis, YAxis, BarChart, Bar, CartesianGrid } from "recharts";

export interface ReleaseYearCardProps {
  data: { year: number; count: number }[];
}

export function ReleaseYearCard({ data }: ReleaseYearCardProps) {
  return (
    <section className="border-border/60 border-b py-8">
      <div className="mb-6">
        <h2 className="text-base font-semibold">Release Year</h2>
      </div>
      <div className="min-w-0">
        {data.length === 0 && (
          <p className="text-muted-foreground">No data available</p>
        )}
        {data.length > 0 && (
          <ChartContainer config={{}} className="h-52 w-full">
            <BarChart responsive data={data}>
              <Bar dataKey="count" fill="var(--chart-1)" />
              <CartesianGrid />
              <XAxis axisLine={false} dataKey="year" />
              <YAxis axisLine={false} width="auto" dataKey="count" />
              <ChartTooltip content={<ChartTooltipContent />} />
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </section>
  );
}
