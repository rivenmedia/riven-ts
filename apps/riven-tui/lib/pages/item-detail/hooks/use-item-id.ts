import { useOutletContext } from "react-router";

interface OutletContext {
  id: string;
}

export function useItemId() {
  const { id } = useOutletContext<OutletContext>();

  return id;
}
