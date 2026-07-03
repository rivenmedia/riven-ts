"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function LiveItemsPagination() {
  return (
    <Pagination
    // count={liveTotalItems}
    // perPage={liveLimit}
    // bind:page={$formData.page}
    >
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => {
              formElement.requestSubmit();
            }}
            className="border-white/10 hover:bg-white/10"
          />
        </PaginationItem>
        <PaginationItem>
          <PaginationNext
            onClick={() => {
              formElement.requestSubmit();
            }}
            className="border-white/10 hover:bg-white/10"
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
