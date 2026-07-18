import { loggedInActionClient } from "@/lib/server-actions/action-client";

import { SearchForm } from "../_form-schemas/search.schema";

export const search = loggedInActionClient
  .inputSchema(SearchForm)
  .action(async ({ parsedInput }) => {});
