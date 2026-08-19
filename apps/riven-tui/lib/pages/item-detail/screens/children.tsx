import { useSuspenseQuery } from "@apollo/client/react";
import { Box, Text } from "ink";
import { useNavigate } from "react-router";

import { useRefetch } from "../../../hooks/use-refetch.ts";
import { useActionsMenuContext } from "../../../ui/actions-menu/actions-menu-context.tsx";
import { MediaItemStateBadge } from "../../../ui/media-item-state-badge.tsx";
import { SelectList } from "../../../ui/select-list.tsx";
import { SelectableRow } from "../../../ui/selectable-row.tsx";
import { useItemId } from "../hooks/use-item-id.ts";
import { GET_MEDIA_ITEM_CHILDREN } from "../queries/get-media-item-children.query.ts";
import { getChildren } from "../utilities/get-children.ts";

export function ItemDetailChildrenTab() {
  const id = useItemId();
  const navigate = useNavigate();
  const { isVisible: isActionsMenuVisible } = useActionsMenuContext();

  const {
    refetch,
    data: { mediaItemById: item },
  } = useSuspenseQuery(GET_MEDIA_ITEM_CHILDREN, {
    fetchPolicy: "network-only",
    variables: { mediaItemId: id },
  });

  useRefetch(refetch, !isActionsMenuVisible);

  const childItems = getChildren(item);

  if (childItems.length === 0) {
    return <Text dimColor>No children found</Text>;
  }

  return (
    <Box flexDirection="column" gap={1}>
      <Box flexDirection="column">
        <Text bold>{item.__typename === "Show" ? "Seasons" : "Episodes"}</Text>
        <SelectList
          items={childItems}
          getKey={(child) => child.id}
          onSelect={(child) => {
            void navigate(`/item/${child.id}`);
          }}
          isActive={!isActionsMenuVisible}
          renderItem={(child, isSelected) => (
            <SelectableRow isSelected={isSelected}>
              {child.type === "season"
                ? `Season ${child.number.toString()}`
                : `Episode ${child.number.toString()}`}{" "}
              — {child.title}{" "}
              <MediaItemStateBadge
                isRequested={child.isRequested}
                state={child.state}
              />
            </SelectableRow>
          )}
        />
      </Box>
    </Box>
  );
}
