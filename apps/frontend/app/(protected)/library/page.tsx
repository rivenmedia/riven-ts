import { LibraryPage } from "./page.client";

export default async function Library() {
  const totalItems = 100_000;
  const items = [];

  return <LibraryPage items={items} totalItems={totalItems} />;
}
