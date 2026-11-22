---
status: accepted
---

# E2E tests run against a real Riven, with external services mocked inside it

The frontend's Playwright suite used to mock every request to Riven, so it
couldn't catch the two disagreeing. We now also run E2E tests against a real
Riven. All external services are mocked, because they aren't what's under test
and the tests must never reach them. Each Playwright worker spawns its own
built Riven, with its own Postgres database, Redis and FUSE mount. Inside Riven,
in-process MSW handles the external services. It also intercepts
`undici.request`, which the VFS uses, through its HTTP request interceptor. Any
request it doesn't handle fails unless it's to loopback, which Riven uses to
call itself.
Before each test, a test-only control endpoint resets Riven and applies a named
mock scenario. One Next.js server is shared by all workers. Each test's traffic
to Riven is re-addressed to its worker's instance: Playwright does this for the
browser's requests, and Next.js' test proxy does it for the server's.

The mocked-backend suite stays for states a real Riven can't easily be put
into, such as backend errors, a pending restart, or a served schema made up for
the test.

## Considered Options

- **A separate mock HTTP server, with each plugin's base URL pointed at it.**
  Rejected: every plugin would need a base URL override, and a plugin that
  missed one would silently reach the real service.
- **One fixed scenario per Riven instance, with tests grouped by scenario.**
  Rejected: it multiplies Riven instances, and CI runs on free GitHub Actions
  runners with little CPU.
- **Serialising MSW handlers from the test to Riven at runtime.** Rejected: MSW
  3 has no cross-process server, so this would mean building one. Named
  scenarios compiled into Riven are simpler and type-checked.
- **One Next.js server per worker.** Rejected for its CI cost. The browser and
  Next.js server interception layers can already redirect requests per test.
- **SQLite instead of Postgres.** Rejected: it lacks `$ilike` and Postgres
  schemas, so it would hide real bugs.

## Consequences

- Riven gets a test mode (`NODE_ENV=test` plus `MOCK_SCENARIO`). The control
  endpoint can wipe the database, so it's only registered in test mode, needs
  the API key, and Riven refuses to load mock scenarios unless `NODE_ENV` is
  `development` or `test`.
- Every E2E instance boots with the same environment. Riven locks any setting
  that comes from an environment variable, so the environment doesn't set
  `enabledPlugins`: the baseline scenario stores every core plugin as enabled,
  and Riven restores that at boot and on every reset. Scenarios can't change
  the environment per test, because settings are frozen at boot, and the
  control endpoint rejects a scenario that sets one. A test that needs a
  different environment would need its worker's Riven restarted, which isn't
  supported yet.
- `@repo/util-e2e` is the contract between the two apps: the seeded users, the
  scenario names, the journeys' fixture data, the control client and the
  environment builder. It must stay side-effect free.
- A journey varies Riven's state only through its named scenario, never by
  changing Riven during the test. Data that a page renders through Next.js'
  `"use cache"` must be the same in every scenario, because one Next.js server
  shares that cache, so it lives in the baseline.
- A reset must also clear Riven's in-memory state (the settings manager,
  `restartRequired`, data-source caches), or state leaks between tests on the
  same worker.
- The CI E2E job needs FUSE, Postgres and Redis, and keeps `workers: 1`, so it
  runs a single Riven instance.
