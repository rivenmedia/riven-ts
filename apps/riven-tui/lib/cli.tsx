#!/usr/bin/env node
import { render } from "ink";

import { createGraphqlClient } from "./graphql/client.ts";
import { App } from "./ui/app.tsx";

const uri = process.env["RIVEN_TUI_GRAPHQL_URL"] ?? "http://localhost:3000/";
const apiKey = process.env["RIVEN_TUI_API_KEY"];

const client = createGraphqlClient({ uri, apiKey });

render(<App client={client} />);
