import { useInView } from "react-intersection-observer";

import { Button } from "#components/_ui/button.tsx";
import { Spinner } from "#components/_ui/spinner.tsx";

interface LoadMoreButtonProps {
  loading: boolean;
  onLoadMore: () => void;
}

export function LoadMoreButton({ onLoadMore, loading }: LoadMoreButtonProps) {
  const { ref } = useInView({
    scrollMargin: "200px",
    onChange(inView) {
      if (inView) {
        onLoadMore();
      }
    },
  });

  return (
    <Button
      ref={ref}
      type="button"
      size="lg"
      onClick={onLoadMore}
      disabled={loading}
    >
      {loading ? <Spinner /> : "Load More"}
    </Button>
  );
}
