import { Box, Text, useInput } from "ink";
import { Tab, Tabs } from "ink-tab";
import { useState } from "react";

import type { ReactNode } from "react";

export interface ConfirmActionProps {
  onConfirm: () => void;
  onCancel: () => void;
  message: ReactNode;
  marginBottom: number;
}

type TabValue = "yes" | "no";

export function ConfirmAction({
  onConfirm,
  onCancel,
  message,
  marginBottom,
}: ConfirmActionProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("no");

  function handleTabChange(tab: string) {
    setActiveTab(tab as TabValue);
  }

  useInput((_input, key) => {
    if (key.escape || key.backspace) {
      onCancel();
    }

    if (key.return) {
      if (activeTab === "yes") {
        onConfirm();
      } else {
        onCancel();
      }
    }
  });

  return (
    <Box
      flexDirection="column"
      marginTop={1}
      marginBottom={marginBottom}
      marginLeft={2}
    >
      <Text bold>{message}</Text>
      <Tabs onChange={handleTabChange} showIndex={false}>
        <Tab name="no">No</Tab>
        <Tab name="yes">Yes</Tab>
      </Tabs>
    </Box>
  );
}
