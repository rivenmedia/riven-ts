import { LibraryPage } from "./page.client";

import type { MediaItem } from "@/app/_types/__generated__/graphql";

export default async function Library() {
  const totalItems = 100_000;
  const items: MediaItem[] = [];

  return <LibraryPage items={items} totalItems={totalItems} />;
}
