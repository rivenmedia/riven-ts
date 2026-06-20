import { redirect } from "@sveltejs/kit";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = ({ params }) => {
  return redirect(301, `/details/entity/${params.id}/person`);
};
