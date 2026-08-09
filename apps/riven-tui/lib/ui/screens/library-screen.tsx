import { Box, Text, useInput } from "ink";

import { useLibraryItems } from "../../hooks/use-library-items.ts";
import { ErrorMessage } from "../error-message.tsx";
import { LoadingIndicator } from "../loading-indicator.tsx";
import { SelectList } from "../select-list.tsx";
import { SelectableRow } from "../selectable-row.tsx";
import { StateBadge } from "../state-badge.tsx";

import type { GraphqlClient } from "../../graphql/graphql-client.ts";

export interface LibraryScreenProps {
  client: GraphqlClient;
  onSelectItem: (id: string) => void;
}

export function LibraryScreen({ client, onSelectItem }: LibraryScreenProps) {
  const { state, refetch } = useLibraryItems(client);

  useInput((input) => {
    if (input === "r") {
      refetch();
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold underline>
        Library
      </Text>
      {state.status === "loading" && (
        <LoadingIndicator label="Loading library" />
      )}
      {state.status === "error" && <ErrorMessage error={state.error} />}
      {state.status === "success" && (
        <Box flexDirection="column">
          <SelectList
            items={state.data}
            getKey={(item) => item.id}
            onSelect={(item) => {
              onSelectItem(item.id);
            }}
            emptyMessage="Your library is empty."
            renderItem={(item, isSelected) => (
              <SelectableRow isSelected={isSelected}>
                {item.fullTitle} <StateBadge state={item.state} />
              </SelectableRow>
            )}
          />
          <Box marginTop={1}>
            <Text dimColor>
              {state.data.length} item{state.data.length === 1 ? "" : "s"} · ↑/↓
              navigate · enter view · r refresh · q quit
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
