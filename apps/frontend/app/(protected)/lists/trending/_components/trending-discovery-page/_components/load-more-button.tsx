import { Button } from "@/components/_ui/button";
import { Spinner } from "@/components/_ui/spinner";

import { useInView } from "react-intersection-observer";

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
