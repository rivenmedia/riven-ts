import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export function LibraryPagination() {
  return (
    <Pagination>
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
