import { Box, Text, useInput } from "ink";
import { useState } from "react";

import { LoadingIndicator } from "./loading-indicator.tsx";
import { SelectList } from "./select-list.tsx";
import { SelectableRow } from "./selectable-row.tsx";

import type {
  ActionResult,
  ActionTarget,
  ItemAction,
} from "../actions/types.ts";

export interface ActionsMenuProps {
  actions: readonly ItemAction[];
  onClose: () => void;
  target: ActionTarget;
}

type MenuState =
  | { phase: "result"; result: ActionResult }
  | { phase: "running"; action: ItemAction }
  | { phase: "select" };

export function ActionsMenu({ actions, onClose, target }: ActionsMenuProps) {
  const [state, setState] = useState<MenuState>({ phase: "select" });

  useInput(
    () => {
      if (state.phase === "result") {
        onClose();
      }
    },
    { isActive: state.phase === "result" },
  );

  const runAction = (action: ItemAction) => {
    setState({ phase: "running", action });

    action
      .run(target)
      .then((result) => {
        setState({ phase: "result", result });
      })
      .catch((error: unknown) => {
        setState({
          phase: "result",
          result: {
            status: "error",
            message: error instanceof Error ? error.message : String(error),
          },
        });
      });
  };

  return (
    <Box borderStyle="round" flexDirection="column" paddingX={1}>
      <Text bold>Actions for {target.title}</Text>
      {state.phase === "select" && (
        <SelectList
          items={actions}
          getKey={(action) => action.id}
          onCancel={onClose}
          onSelect={runAction}
          renderItem={(action, isSelected) => (
            <Box flexDirection="column">
              <SelectableRow isSelected={isSelected}>
                {action.label}
              </SelectableRow>
              {isSelected && (
                <Text dimColor>
                  {"    "}
                  {action.description}
                </Text>
              )}
            </Box>
          )}
        />
      )}
      {state.phase === "running" && (
        <LoadingIndicator label={`Running "${state.action.label}"`} />
      )}
      {state.phase === "result" && (
        <Box flexDirection="column">
          <Text color={state.result.status === "success" ? "green" : "red"}>
            {state.result.message}
          </Text>
          <Text dimColor>Press any key to close.</Text>
        </Box>
      )}
    </Box>
  );
}
