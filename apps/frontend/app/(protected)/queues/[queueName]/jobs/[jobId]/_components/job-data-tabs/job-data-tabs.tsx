"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "#components/_ui/tabs.tsx";

import { CodeBlock } from "../code-block/code-block.tsx";

import type { JobState } from "../../../../../_utilities/job-states.ts";

export interface JobDataTabsProps {
  data: unknown;
  returnValue?: unknown;
  state: JobState;
}

/** Tabs for a job's input data and its return value. */
export function JobDataTabs({ data, returnValue, state }: JobDataTabsProps) {
  return (
    <Tabs defaultValue="input">
      <TabsList>
        <TabsTrigger value="input">Input data</TabsTrigger>
        <TabsTrigger value="return">Return value</TabsTrigger>
      </TabsList>
      <TabsContent value="input">
        <CodeBlock label="Input data">
          {JSON.stringify(data, null, 2)}
        </CodeBlock>
      </TabsContent>
      <TabsContent value="return">
        {returnValue === undefined ? (
          <p className="text-muted-foreground text-sm">
            {state === "failed"
              ? "No return value. The job failed before it finished."
              : "No return value."}
          </p>
        ) : (
          <CodeBlock label="Return value">
            {JSON.stringify(returnValue, null, 2)}
          </CodeBlock>
        )}
      </TabsContent>
    </Tabs>
  );
}
