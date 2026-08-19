import { useInput } from "ink";

import type { OperationVariables } from "@apollo/client";
import type { RefetchFunction } from "@apollo/client/react/internal";

export function useRefetch(
  refetch: RefetchFunction<unknown, OperationVariables>,
  isActive = true,
) {
  useInput(
    (input) => {
      if (input.toLowerCase() === "r") {
        void refetch();
      }
    },
    { isActive },
  );
}
