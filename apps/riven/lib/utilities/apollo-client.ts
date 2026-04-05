import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

export let client: ApolloClient;

export function initApolloClient(uri: string) {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (client) {
    return;
  }

  client = new ApolloClient({
    link: new HttpLink({ uri }),
    cache: new InMemoryCache(),
  });
}
