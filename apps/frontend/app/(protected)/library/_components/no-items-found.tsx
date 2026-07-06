import { Button } from "@/components/ui/button";

import { Search } from "lucide-react";
import Link from "next/link";

export function NoItemsFound() {
  return (
    <div className="flex min-h-[50vh] flex-1 flex-col items-center justify-center space-y-4 text-center">
      <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/5 bg-zinc-900/50">
        <Search className="h-10 w-10 text-zinc-600" />
      </div>
      <div>
        <h3 className="text-xl font-medium text-white">No items found</h3>
        <p className="mx-auto mt-2 max-w-sm text-zinc-500">
          {
            "We couldn't find anything matching your search. Try adjusting the filters or search term."
          }
        </p>
      </div>
      <Button
        asChild
        variant="outline"
        className="border-white/10 hover:bg-white/5"
      >
        <Link href="/library">Clear all filters</Link>
      </Button>
    </div>
  );
}
