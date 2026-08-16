import { CombinedGraphQLErrors } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import { TitledBox } from "@mishieck/ink-titled-box";
import { Box, Text, useInput } from "ink";
import { useState } from "react";

import { LoadingIndicator } from "../loading-indicator.tsx";
import { SelectList } from "../select-list.tsx";
import { SelectableRow } from "../selectable-row.tsx";
import { ActionResult } from "./action-result.tsx";
import { useActionsMenuContext } from "./actions-menu-context.tsx";
import { ConfirmAction } from "./confirm-action.tsx";

import type { ActionTarget, ItemAction } from "../../types/actions.ts";
import type { ApolloClient } from "@apollo/client";

export interface ActionsMenuProps {
  actions: readonly ItemAction[];
  target: ActionTarget;
}

export function ActionsMenu({ actions, target }: ActionsMenuProps) {
  const client = useApolloClient();

  const [selectedAction, setSelectedAction] = useState<ItemAction>();
  const [called, setCalled] = useState(false);
  const [mutationError, setMutationError] =
    useState<CombinedGraphQLErrors | null>(null);
  const [result, setResult] = useState<ApolloClient.MutateResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { closeMenu } = useActionsMenuContext();

  useInput(
    () => {
      closeMenu();
    },
    { isActive: called },
  );

  useInput((_, key) => {
    if (key.escape) {
      closeMenu();
    }
  });

  const runAction = (action: ItemAction) => {
    setSelectedAction(action);

    client
      .mutate({
        mutation: action.mutation,
        variables: action.variables,
      })
      .then((response) => {
        setResult(response);

        action.onComplete?.(target, response);
      })
      .catch((error: unknown) => {
        if (CombinedGraphQLErrors.is(error)) {
          setMutationError(error);

          action.onError?.(target, error);
        }
      })
      .finally(() => {
        setLoading(false);
      });

    setCalled(true);
    setLoading(true);
  };

  return (
    <TitledBox
      borderStyle="round"
      borderDimColor
      flexDirection="column"
      paddingX={1}
      titles={["Actions"]}
      top={2}
      right={2}
      bottom={2}
      position="absolute"
      maxWidth="50%"
    >
      {!called && (
        <SelectList
          items={actions}
          getKey={(action) => action.id}
          onCancel={closeMenu}
          onSelect={setSelectedAction}
          isActive={!selectedAction}
          renderItem={(action, isSelected, index) => (
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
              {selectedAction?.id === action.id && (
                <ConfirmAction
                  message="Are you sure?"
                  onConfirm={() => {
                    runAction(action);
                  }}
                  onCancel={() => {
                    setSelectedAction(undefined);
                  }}
                  marginBottom={index < actions.length - 1 ? 1 : 0}
                />
              )}
            </Box>
          )}
        />
      )}
      {selectedAction && loading && (
        <LoadingIndicator label={`Running "${selectedAction.label}"`} />
      )}
      {selectedAction && (result ?? mutationError) && (
        <ActionResult
          result={result}
          error={mutationError}
          selectedAction={selectedAction}
          target={target}
        />
      )}
    </TitledBox>
  );
}
