import { LibraryPage } from "./page.client";

export default async function Library() {
  const totalItems = 100000;
  const items = [];

  return <LibraryPage items={items} totalItems={totalItems} />;
}
