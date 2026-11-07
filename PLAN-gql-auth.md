# Plan: GraphQL authentication (#254)

Issue: https://github.com/rivenmedia/riven-ts/issues/254

Branch: `feat/254-gql-authentication`, cut from `main` at `b5560021`.

## Goal

Riven's GraphQL API must deny unauthorised requests. A caller who signed in through better-auth sends a credential with each request. The backend reads the credential, works out who the caller is, and checks each field's `@Authorized` requirement separately. A permitted parent field never grants access to a child field.

## Progress

Feature playbook steps, copied verbatim:

- [x] 1. `how` over the affected subsystem. Done inline from direct reads. The findings are in "How the API works today".
- [x] 2. `architect` for parallel design exploration. Skip: the user reviewed this plan on 2026-11-07 and kept every default, so this document is the design checkpoint. The design alternatives are in "Alternatives considered". A cross-judge could not run in any case, because every configured judge model is in the parent's Claude family.
- [x] 3. Write the throughput checkpoint as four todo items. A dimension that genuinely does not apply (single file, no fan-out) keeps its item with `n/a: <reason>` rather than being dropped:
  - **Blocking first steps.** Gates run before fan-out.
  - **Independent workstreams.** Disjoint files, services, or layers parallelize. Shared writes serialize.
  - **Shared mutable state.** Default to splitting the target (the **separate-before-serializing-shared-state** principle skill). Serialize only for real invariants.
  - **Smallest safe decomposition.** If one worker is best, name why.
- [ ] 4. Delegate code-writing to a subagent using your configured feature model (default `grok-4.7-xhigh-fast`) with a specific scope (file paths, named data shape and its organizing structure per **principle-model-the-domain**, a state machine over scattered booleans, a table/registry over branching, a typed model over repeated shape assumptions, chosen before the delegate writes logic, and success criteria). Pick each subagent's reasoning level and fast or standard speed for the job, per the Subagents section. When the implementation admits multiple valid shapes (error handling, abstraction layer, test structure), delegate via the **arena** skill instead so the runners surface the alternatives and the cross-judge guards the pick. Mandatory: no skip-with-reason escape, and Laziness Protocol does not override it (the gain is review separation, not lines saved). A subagent forbidden to spawn satisfies this by owning the diff directly with the same review separation. No "standing by" reply that waits on a nested agent. Comments per **Comments**. Surgical edits, re-ground against the source for upstream-derived files. Port shared-primitive improvements to all consumers and verify each. Commit liberally.
- [ ] 5. Verify on the matching surface. "Inconclusive" or wrong-surface is not a pass. Flag it.
- [ ] 6. Rebase into small, ordered commits. Stack follow-ups.
- [ ] 7. If the design is contested, `interrogate` before shipping.

Implementation units, in commit order. The "Implementation units" section has the details.

- [ ] U1. Shared permission model in `@repo/util-auth`.
- [ ] U2. `apiKey` setting for callers that have no user.
- [ ] U3. Resolve the caller of each request. Nothing is enforced yet.
- [ ] U4. The frontend and the TUI send credentials.
- [ ] U5. Enforce the permission map, with coverage and scenario tests.
- [ ] U6. Docs and docker examples.
- [ ] Verification on the running app.

Stop the run when weekly usage reaches 85%. Before each unit, run `python3 -I ~/.claude/scripts/check-usage.py 85`. The script exits with code 3 once weekly usage reaches the threshold. The script lives outside the repository.

## How the API works today

- `apps/riven/lib/state-machines/bootstrap/actors/start-gql-server.actor.ts` builds one Express app. Requests to `/api/auth/*splat` go to better-auth through `toNodeHandler(auth)`. Requests to `/graphql` go to Apollo through `expressMiddleware`. A `graphql-ws` server on the same path handles subscriptions. Both paths call `buildContextFunction`, which ignores the request.
- `ApolloServerContext` in `apps/riven/lib/graphql/context.ts` holds no caller identity. Every field is public today.
- `buildSchema` in `packages/core/util-graphql-schema/lib/index.ts` wraps TypeGraphQL's `buildSchema` without an `authChecker`. TypeGraphQL 2.0.0-rc.2 throws at build time when a field has `@Authorized` and no `authChecker` exists (`schema-generator.js`, line 42).
- `apps/riven/lib/auth/auth.ts` configures better-auth with the admin plugin and the `admin`, `manager`, and `user` roles from `packages/util-auth/lib/access-control.ts`. The cookie prefix is `riven`.
- The frontend already checks permissions before it calls a mutation. `checkPermissionMiddleware` in `apps/frontend/lib/server-actions/middlewares/check-permission.middleware.ts` asks better-auth, and each `*.action.ts` declares its permission in `.metadata(...)`. The backend permission map below copies those declarations.

Six kinds of caller use the API. Only browser subscriptions send a credential today. Every other caller breaks as soon as fields require authentication, so each one gets a credential before enforcement starts.

| Caller                                           | Code                                                                   | Transport                                                                                                                     | Credential it can send                                              |
| ------------------------------------------------ | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Next.js server (RSC, server actions, `proxy.ts`) | `apps/frontend/lib/graphql/client.ts`                                  | HTTP to `BACKEND_URL`                                                                                                         | The user's session cookie, read through `next/headers`              |
| Browser queries                                  | `HttpLink` in `apps/frontend/components/providers/apollo-provider.tsx` | HTTP to `privateEnvironment.BACKEND_URL`. That variable is server-only, so the browser falls back to `http://localhost:3000`. | None. The request is cross-origin, so the browser sends no cookies. |
| Browser subscriptions                            | `GraphQLWsLink` in the same file                                       | WebSocket to the frontend's own origin. `proxy.ts` forwards it to the backend.                                                | The session cookie on the upgrade request                           |
| Sandboxed job workers (BullMQ worker threads)    | `create-sandboxed-job.processor.ts`, through `initApolloClient`        | HTTP to `http://<host>:<port>/graphql`                                                                                        | None                                                                |
| Seerr webhook                                    | The `seerrHandleWebhook` mutation in `packages/plugin-seerr`           | HTTP from Seerr                                                                                                               | A fixed `Authorization` header, set in Seerr's webhook settings     |
| TUI                                              | `apps/riven-tui/lib/graphql/client.ts`                                 | HTTP to `RIVEN_TUI_SETTING__graphqlUrl`                                                                                       | None                                                                |

## Design

### Data shapes

**`Permissions`**, in `packages/util-auth/lib/access-control.ts`. This is a partial map from resource to a list of actions, derived from the existing `statement` object. `{ item: ["delete"] }` type-checks and `{ item: ["delet"] }` does not. The same file exports the role map `roles = { admin, manager, user }` and a pure function `roleHasPermissions(role, permissions)`. better-auth's admin plugin lets a role string hold several comma-separated roles, so the function splits it. An unknown or missing role grants nothing. `apps/riven/lib/auth/auth.ts` passes the same `roles` object to `adminPlugin`, so better-auth and the GraphQL checker read one role table.

**`Principal`**, in `apps/riven/lib/graphql/auth/principal.ts`. A discriminated union:

```ts
type Principal =
  | { kind: "anonymous" }
  | { kind: "service" }
  | { kind: "user"; userId: string; role: string };
```

`resolvePrincipal(headers: Headers): Promise<Principal>` is the only code that reads credentials. It runs once per HTTP request and once per WebSocket operation. A bad or missing credential produces `anonymous`, never an error, so public fields still resolve. Scenarios 2 and 4 depend on that.

**`isAuthorized(principal, required: Permissions[]): boolean`**. A pure function. `anonymous` fails every check. `service` passes every check. A `user` passes an empty list, which means "signed in", and otherwise needs every listed statement. The TypeGraphQL `authChecker` is a one-line adapter that reads the principal from the context and calls `isAuthorized`.

### Credentials

`resolvePrincipal` reads `Authorization: Bearer <token>` and the session cookie, in this order:

1. If the bearer token equals the `apiKey` setting, the caller is `service`. The comparison uses `crypto.timingSafeEqual`.
2. If a bearer token is present and is not the API key, `resolvePrincipal` copies it into the request's cookie header under better-auth's session cookie name, read from `auth.$context` (`authCookies.sessionToken.name`). It then calls `auth.api.getSession({ headers })`. better-auth verifies the token's signature and looks up the session, so a forged or expired token yields no session.
3. With no bearer token, `auth.api.getSession({ headers })` reads the session cookie that came with the request. The browser's same-origin requests and WebSocket upgrades use this path.

The frontend sends the user's own session token, so the backend applies that user's role. The API key is for callers that have no user: sandboxed workers, Seerr, and the TUI.

### Wiring

- `ApolloServerContext[CoreKey]` gains `principal: Principal`. The plugin SDK's `GraphQLContext` does not change.
- `buildContextFunction` returns `(headers: Headers) => Promise<ApolloServerContext>`. `start-gql-server.actor.ts` adapts it twice. The Express adapter passes `fromNodeHeaders(req.headers)` from `better-auth/node`. The `graphql-ws` adapter passes the upgrade request's headers, plus `connectionParams.authorization` when the client sends it.
- `buildSchema` in `@repo/core-util-graphql-schema` makes `authChecker` a required option. It keeps TypeGraphQL's default `authMode: "error"`. A denied field resolves to `null` with an error whose `extensions.code` is `UNAUTHENTICATED` when there is no principal, or `UNAUTHORIZED` when a permission is missing. Sibling fields still resolve.
- `buildMockServer` in `packages/core/util-mock-graphql-server` passes a checker that allows everything. Plugin unit tests cover plugin logic. The core suite covers authorisation over the full schema, plugin resolvers included.
- `formatError` in `start-gql-server.actor.ts` logs `UNAUTHENTICATED` and `UNAUTHORIZED` errors at `debug` instead of `error`, so expired sessions do not fill the error log.

### Declaring requirements

- `RequirePermissions(permissions: Permissions)` wraps `Authorized<Permissions>(permissions)` so the compiler checks the permission object. It lives in `@repo/util-plugin-sdk`, because core resolvers, plugin resolvers, and the SDK's own entities all need it. `util-plugin-sdk` gains a workspace dependency on `@repo/util-auth`.
- A field that only needs a signed-in caller uses plain `@Authorized()`.
- Read-only resolver classes put `@Authorized()` on the class. TypeGraphQL applies a class-level requirement to every query, mutation, subscription, and field resolver in the class. A method-level requirement replaces it, which is what mutations need (`findFieldRoles` in `metadata-storage.js`).
- TypeGraphQL runs the check for each field separately, so a parent never authorises its child. The scenario tests prove this on a real nested field.

### Permission map

Every root field must appear in this table. The coverage test enforces that.

| Field                                                                                                                          | Kind         | Requirement                     | Reason                                          |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------ | ------------------------------- | ----------------------------------------------- |
| `authProviders`                                                                                                                | query        | public                          | The login page renders it before sign-in.       |
| `instanceStatus`                                                                                                               | query        | signed in                       | `proxy.ts` calls it only when a session exists. |
| `mediaItemById`, `mediaItems`, `mediaItemsCount`, `recentlyAdded`, `episode`, `calendar`, `search`, `itemRequestByExternalIds` | query        | signed in                       | Library browsing.                               |
| `settingsSection`, `settingsPlugins`                                                                                           | query        | `instance: ["manage-settings"]` | Matches the gate in `settings/layout.tsx`.      |
| `vfsEntryStat`, `vfsEntry`, `vfsDirectoryEntryPaths`                                                                           | query        | `instance: ["manage-settings"]` | Decision 1.                                     |
| `requestItem`                                                                                                                  | mutation     | `item: ["request"]`             | `request-item.action.ts`                        |
| `removeItemRequest`                                                                                                            | mutation     | `item: ["delete"]`              | `delete-item.action.ts`                         |
| `resetMediaItem`                                                                                                               | mutation     | `item: ["reset"]`               | `reset-item.action.ts`                          |
| `blacklistActiveStream`                                                                                                        | mutation     | `item: ["reset"]`               | `blacklist-active-stream.action.ts`             |
| `retryMediaItem`                                                                                                               | mutation     | `item: ["retry"]`               | `retry-item.action.ts`                          |
| `pauseMediaItem`                                                                                                               | mutation     | `item: ["pause"]`               | `pause-item.action.ts`                          |
| `resumeMediaItem`                                                                                                              | mutation     | `item: ["resume"]`              | `resume-item.action.ts`                         |
| `updateSettingsSection`, `resetSettingsFields`, `setPluginEnabled`                                                             | mutation     | `instance: ["manage-settings"]` | The settings actions.                           |
| `saveStreamUrl`, `shareLogs`                                                                                                   | mutation     | `instance: ["manage-settings"]` | Decision 1.                                     |
| Media item, season, and item request subscriptions                                                                             | subscription | signed in                       | The detail pages.                               |
| Plugin `*IsValid` queries and `notificationsIsConfigured`                                                                      | query        | signed in                       | Decision 1.                                     |
| `tmdb*`, `listrr*`, `seerrMovies`, `seerrShows`, `mdbListItems`                                                                | query        | signed in                       | The discovery pages.                            |
| `seerrHandleWebhook`                                                                                                           | mutation     | `item: ["request"]`             | The webhook requests items.                     |
| `MediaEntry.downloadUrl`, `MediaEntry.streamPermalink`                                                                         | nested field | `instance: ["manage-settings"]` | Decision 2.                                     |

Other object fields have no requirement of their own. A caller reaches them only through a protected root field.

### Settings, workers, docker, and the TUI

- `apps/riven/lib/riven-settings.schema.ts` gains `apiKey: z.string().min(32).optional()` in the `server` wiki section. If it is unset, the main thread generates a key with `crypto.randomBytes` at startup. It also logs a warning that external callers cannot authenticate until a key is configured.
- Worker threads already read settings through `getEnvironmentData("settings")` in `apps/riven/lib/utilities/settings.ts`. The main thread shares a generated key the same way, so every thread uses one key.
- `initApolloClient` in `apps/riven/lib/graphql/apollo-client.ts` sends `Authorization: Bearer <settings.apiKey>`. That covers the sandboxed workers and the main-thread client.
- `apps/riven/.env.riven.example` documents `RIVEN_SETTING__apiKey`. The V2 path of the wiki's docker compose generator (`apps/wiki/components/docker-compose-generator.tsx`) writes a generated key. The Seerr plugin docs tell users to put `Bearer <key>` in Seerr's webhook **Authorization Header** field. `pnpm codegen:config-docs` regenerates the settings reference.
- The TUI gains an optional `RIVEN_TUI_SETTING__apiKey` and sends it as a bearer token. See decision 3.

### Frontend

The frontend changes only attach a credential to requests.

- `apps/frontend/lib/graphql/client.ts` adds an Apollo `SetContextLink` in front of the `HttpLink`. The link reads the session cookie with `getSessionCookie` from `better-auth/cookies`, using the cookie prefix `riven`, which also matches the `__Secure-` variant. It then sets `Authorization: Bearer <token>`. The link runs per operation, so it works in RSC, server actions, and `proxy.ts`. If no cookie exists, it sends no header.
- `apps/frontend/components/providers/apollo-provider.tsx` points the browser `HttpLink` at `/graphql` on the frontend's own origin, as the WebSocket link already does. `proxy.ts` already rewrites `/graphql` to the backend, so the session cookie travels with the request and page scripts never see the token. See decision 4.
- The Storybook client in `lib/graphql/__mocks__/client.ts` does not change. The MSW mocks ignore headers.

## Alternatives considered

| Choice                                        | Picked                                                                                                      | Rejected, and why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| How the user's credential reaches the backend | A bearer token that `resolvePrincipal` maps onto the session cookie, with the cookie itself as the fallback | better-auth's `bearer()` plugin does the same mapping. Its `after` hook also returns the session token in a `set-auth-token` header on every sign-in response and exposes that header to scripts, which undoes the HttpOnly cookie. Forwarding the raw `Cookie` header from Next.js does not match the spec, which names an authorisation header. better-auth's `jwt()` plugin issues stateless tokens that survive a ban or role change until they expire, and the frontend would need a step that mints them. better-auth's per-user API-key plugin needs a table, a migration, and key-management UI, all outside this issue. |
| Callers with no user                          | One `apiKey` setting, generated per boot when unset                                                         | A per-boot internal token alone leaves Seerr and the TUI unable to authenticate. Trusting requests from localhost fails because Docker networking and the Next.js rewrite hide the real source address.                                                                                                                                                                                                                                                                                                                                                                                                                          |
| What a denied field returns                   | `authMode: "error"`                                                                                         | With `authMode: "null"`, clients cannot tell a denied field from an empty one, and the frontend cannot send the user to the login page on `UNAUTHENTICATED`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| How new root fields stay protected            | A test that runs every root resolver as `anonymous`                                                         | A runtime middleware that rejects root fields without a requirement fails in production instead of CI. It also blocks a field that was meant to be public without saying why.                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Where `RequirePermissions` lives              | `@repo/util-plugin-sdk`                                                                                     | In `apps/riven` alone, plugins and SDK entities could not use it. They would fall back to an untyped `Authorized({...})`, where a misspelled permission compiles.                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

## Implementation units

Each unit is one commit, and the app works after each one. Enforcement starts in U5, after every caller sends a credential.

**U1. Shared permission model.** Commit: `feat(auth): export role map and permission check`.

- Add `Permissions`, `roles`, and `roleHasPermissions` to `packages/util-auth/lib/access-control.ts`.
- Use `roles` in `apps/riven/lib/auth/auth.ts`.
- Check: a table test in `packages/util-auth` covers each role against each resource, a comma-separated role string, an unknown role, and a missing role. Run `pnpm --filter @repo/util-auth test`, `check-types`, and `lint`.

**U2. API key for callers with no user.** Commit: `feat(riven): add apiKey setting for service callers`.

- Add the schema field, generate and share the key, add the `initApolloClient` header, and update `.env.riven.example`.
- Check: a test confirms that the main thread and a worker thread see the same generated key. Another confirms that a configured key shorter than 32 characters fails to parse.
- Confirm that `buildSettingsSections` does not show the bootstrap `apiKey` in the settings UI.

**U3. Resolve the caller of each request, with nothing enforced.** Commit: `feat(riven): resolve the caller of each GraphQL request`.

- Add `principal.ts`, `isAuthorized`, and the `authChecker`. Wire the context for HTTP and WebSocket.
- Make `authChecker` required in `buildSchema`, and pass the allow-all checker in `buildMockServer`. Quiet the auth errors in `formatError`.
- `createGqlContext` in `apps/riven/lib/__tests__/test-context.ts` takes a `principal` argument that defaults to `service`, so the existing resolver specs pass unchanged.
- Check: test `resolvePrincipal` against a real better-auth instance on the test database. Sign up a user, sign in, and send the token. Cover a valid token, a token with a bad signature, the API key, a wrong API key, the cookie alone, and no credential. Test `isAuthorized` with a table over the three principal kinds and the three roles. The full `@repo/riven` suite still passes.

**U4. Callers send credentials.** Commits: `feat(frontend): send the session token to the GraphQL API` and `feat(riven-tui): send the API key to the GraphQL API`.

- Check: an MSW test on the frontend server client asserts that the outgoing request carries `Authorization: Bearer <cookie value>` when the cookie exists, and no `Authorization` header when it does not. The frontend's `test`, `check-types`, and `lint` pass.

**U5. Enforcement.** Commit: `feat(riven): require authorisation on GraphQL fields`.

- Apply the permission map to the core resolvers, the plugin resolvers, and the two `MediaEntry` fields.
- Add the coverage test and the scenario tests described below.
- Check: the full test suites of `@repo/riven` and every plugin pass.

**U6. Docs and examples.** Commit: `docs: document GraphQL authentication and the API key`.

- Update the wiki generator and the Seerr plugin docs. Regenerate the config docs.
- Check: `pnpm --filter @repo/wiki build` succeeds, and the generator tests pass.

## Tests

Every authorisation test runs a GraphQL operation. A test fails if a field loses its protection, and keeps passing if only the internals change.

**Coverage test**, in `apps/riven/lib/graphql/__tests__/authorization-coverage.spec.ts`. Build the full schema from the core resolvers and every plugin's resolvers. For each root field of `Query`, `Mutation`, and `Subscription`, call the field's own `resolve` or `subscribe` function with an `anonymous` context and empty arguments. Expect `UNAUTHENTICATED` for every field except those on the public list, which holds only `authProviders`. The auth middleware runs before the resolver reads its arguments, so empty arguments are safe. A new root field with no requirement runs its body instead, and the test fails.

**Scenario tests**, in `apps/riven/lib/graphql/__tests__/authorization.spec.ts`. Start the server with the real context function. Seed one `admin` user, one `user`-role user, and a completed movie with a media entry. Send real HTTP requests with real headers.

| Issue scenario             | Request                                                                                 | Expected result                                                                                   |
| -------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1. Valid header            | Admin token. `{ mediaItems { ... } settingsSection(id) { id } }`                        | Both fields return. No errors.                                                                    |
| 1. Valid header, API key   | `Bearer <apiKey>`. The same document.                                                   | Both fields return. No errors.                                                                    |
| 2. Invalid header          | `Bearer garbage`. `{ authProviders { key } mediaItems { ... } }`                        | `authProviders` returns. `mediaItems` is null with `UNAUTHENTICATED`.                             |
| 3. Partial, sibling fields | `user` token. `{ mediaItems { ... } settingsSection(id) { id } }`                       | `mediaItems` returns. `settingsSection` is null with `UNAUTHORIZED`.                              |
| 3. Partial, nested field   | `user` token. `mediaItemById` selecting `mediaEntries { originalFilename downloadUrl }` | `originalFilename` returns. `downloadUrl` is null with `UNAUTHORIZED`.                            |
| 3. Partial, mutations      | `user` token. `requestItem`, then `resetMediaItem`.                                     | `requestItem` succeeds. `resetMediaItem` fails with `UNAUTHORIZED` and leaves the item unchanged. |
| 4. Public fields only      | No header. `{ authProviders { key } }`                                                  | `authProviders` returns. No errors.                                                               |
| Subscriptions              | WebSocket subscribe without a cookie, then with one                                     | The first fails with `UNAUTHENTICATED`. The second receives events.                               |

The nested-field row is the parent-and-child check the spec calls imperative. The caller may read `mediaItemById`, and `downloadUrl` beneath it is still denied.

## Verification

The issue's verification plan maps onto these checks:

- Unit tests covering edge cases and error handling: the unit, coverage, and scenario tests above.
- Contract tests against mock service definitions: the frontend MSW test in U4. The frontend Storybook tests (`pnpm --filter @repo/frontend test:component`) must still pass, because the mocks ignore headers.
- Linter and static type checks with zero warnings: `pnpm turbo run lint check-types test`, then `pnpm format:check` and `pnpm knip` at the root.

Then check the running app:

1. Start the database and cache with `docker compose up -d riven-db riven-cache`. Start the backend with `pnpm --filter @repo/riven dev` and `RIVEN_SETTING__adminUserCredentials` set.
2. Use `curl` to send the scenario documents to `http://localhost:3000/graphql` four ways: with no header, with a bad bearer token, with the API key, and with a session token from `POST /api/auth/sign-in/username`. Compare each response with the scenario table.
3. Trigger a scrape so that a sandboxed worker queries `mediaItemById`. Confirm that the job completes and that the backend log has no `UNAUTHENTICATED` entries.
4. Start the frontend with `pnpm --filter @repo/frontend dev`. Sign in once as the admin and once as a `user`-role account. Drive the home, library, details, and settings pages with the `control-ui` skill. Confirm that data loads and that item state badges update over the subscription. Confirm that the `user` account cannot open settings or reset an item.
5. Run `pnpm tui` with `RIVEN_TUI_SETTING__apiKey` and without it. Confirm that it loads data only with the key.

## Throughput checkpoint

- **Blocking first steps.** U1 and U3. Every later unit depends on `Permissions` and `Principal`.
- **Independent workstreams.** After U3, three pieces of work touch disjoint files: the frontend and TUI changes (U4), the docs (U6), and the resolver annotations with their tests (U5). U2 touches only the settings files and `apollo-client.ts`.
- **Shared mutable state.** `pnpm-lock.yaml` changes once, in U3, when `util-plugin-sdk` gains its `util-auth` dependency. `test-context.ts` also changes once, in U3. The generated `*.spec.typegen.ts` files belong to one spec each, so they do not collide.
- **Smallest safe decomposition.** One backend owner takes U1, U2, U3, and U5. The schema, the context, and the annotations are coupled, and enforcement must land last. A second worker takes U4 and U6 once U3 has landed.

## Decisions

The user reviewed these on 2026-11-07 and kept every default. The implementation follows them.

1. **Fields with no frontend precedent.** The default requires `instance: ["manage-settings"]` for the `vfs*` queries, `saveStreamUrl`, and `shareLogs`. Plugin `*IsValid` queries require only a signed-in caller.
2. **Debrid links.** The default restricts `MediaEntry.downloadUrl` and `MediaEntry.streamPermalink` to `manage-settings`. No client queries them today. They also give Scenario 3's nested case a real field to test. Without the restriction, the nested case moves to a test-only schema.
3. **The TUI.** The issue's scope list leaves the TUI out, but enforcement breaks it. The default adds `RIVEN_TUI_SETTING__apiKey`. That is the "providing the API key to the requests" change that the scope allows for UI code.
4. **Browser queries.** The default moves the browser `HttpLink` to the frontend's own origin. Without that change, browser queries cannot carry a credential. It is a one-line change in `apollo-provider.tsx`.
5. **API key scope.** The API key grants full access, the same as an admin. A scoped key needs better-auth's API-key plugin and a migration, which belongs in a separate issue.

## Known limits

- A WebSocket operation checks the session when it starts. A running subscription keeps streaming after the session expires or the user is banned, until the client reconnects.
- A denied non-null field makes its nearest nullable parent null, as the GraphQL spec requires. The scenario tests select nullable fields or root fields, so the partial results stay visible.
