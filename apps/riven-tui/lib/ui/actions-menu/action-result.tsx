import { Box, Text } from "ink";

import { ActionResultMessage } from "./action-result-message.tsx";

import type { ActionTarget, ItemAction } from "../../types/actions.ts";
import type { ApolloClient, CombinedGraphQLErrors } from "@apollo/client";

export interface ActionResultProps {
  target: ActionTarget;
  selectedAction: ItemAction;
  result: ApolloClient.MutateResult | null;
  error: CombinedGraphQLErrors | null;
}

export function ActionResult({
  selectedAction,
  result,
  error,
  target,
}: ActionResultProps) {
  const { type, message } = selectedAction.buildResultMessageData(
    target,
    result,
    error,
  );

  return (
    <Box flexDirection="column">
      <ActionResultMessage type={type} message={message} />
      <Text dimColor>Press any key to close.</Text>
    </Box>
  );
}
