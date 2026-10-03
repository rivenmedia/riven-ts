# MSW Skill

Created by **[Anivar Aravind](https://anivar.net)**

An AI agent skill for writing, reviewing, and debugging MSW (Mock Service Worker) v2 handlers, server setup, and test patterns with modern best practices.

## The Problem

AI agents often generate outdated MSW v1 patterns — `rest.get()` instead of `http.get()`, `res(ctx.json(...))` instead of `HttpResponse.json()`, `(req, res, ctx)` instead of `({ request, params })` — and miss critical testing best practices like `server.boundary()` for concurrent tests, `onUnhandledRequest: 'error'`, and proper lifecycle hook setup. These produce code that fails to compile or silently misbehaves at runtime.

## This Solution

20 rules with incorrect/correct code examples that teach agents MSW v2's actual API, handler design, server lifecycle, response construction, testing patterns, GraphQL usage, and v1-to-v2 migration. Each rule targets a specific mistake and shows exactly how to fix it.

## Install

```bash
npx skills add anivar/msw-skill -g
```

Or with full URL:

```bash
npx skills add https://github.com/anivar/msw-skill
```

## Baseline

- msw ^2.15.0
- TypeScript/JavaScript

## What's Inside

### 20 Rules Across 7 Categories

| Priority | Category              | Rules | Impact   |
| -------- | --------------------- | ----- | -------- |
| 1        | Handler Design        | 4     | CRITICAL |
| 2        | Setup & Lifecycle     | 3     | CRITICAL |
| 3        | Request Reading       | 2     | HIGH     |
| 4        | Response Construction | 3     | HIGH     |
| 5        | Test Patterns         | 4     | HIGH     |
| 6        | GraphQL               | 2     | MEDIUM   |
| 7        | Utilities             | 2     | MEDIUM   |

Each rule file contains:

- Why it matters
- Incorrect code with explanation
- Correct code with explanation
- Decision tables and additional context

### 6 Deep-Dive References

| Reference               | Covers                                                                            |
| ----------------------- | --------------------------------------------------------------------------------- |
| `handler-api.md`        | `http.*` and `graphql.*` methods, URL predicates, path params, handler options    |
| `response-api.md`       | `HttpResponse` class, all 7 static methods, cookie handling                       |
| `server-api.md`         | `setupServer`/`setupWorker`, lifecycle events, `boundary()`, `onUnhandledRequest` |
| `test-patterns.md`      | Vitest/Jest setup, per-test overrides, concurrent isolation, cache clearing       |
| `migration-v1-to-v2.md` | Complete v1 to v2 breaking changes with migration mapping                         |
| `anti-patterns.md`      | 10 common mistakes with BAD/GOOD examples                                         |

## Structure

```
├── SKILL.md                          # Entry point for AI agents
├── AGENTS.md                         # Compiled guide with all rules expanded
├── rules/                            # Individual rules (Incorrect/Correct)
│   ├── handler-*                     # Handler design (CRITICAL)
│   ├── setup-*                       # Setup & lifecycle (CRITICAL)
│   ├── request-*                     # Request reading (HIGH)
│   ├── response-*                    # Response construction (HIGH)
│   ├── test-*                        # Test patterns (HIGH)
│   ├── graphql-*                     # GraphQL (MEDIUM)
│   └── util-*                        # Utilities (MEDIUM)
└── references/                       # Deep-dive reference docs
    ├── handler-api.md
    ├── response-api.md
    ├── server-api.md
    ├── test-patterns.md
    ├── migration-v1-to-v2.md
    └── anti-patterns.md
```

## Ecosystem — Skills by [Anivar Aravind](https://anivar.net)

### Testing Skills

| Skill                                                              | What it covers                                                                | Install                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------- | --------------------------------------------- |
| [jest-skill](https://github.com/anivar/jest-skill)                 | Jest best practices — mock design, async testing, matchers, timers, snapshots | `npx skills add anivar/jest-skill -g`         |
| [zod-testing](https://github.com/anivar/zod-testing)               | Zod schema testing — safeParse, mock data, property-based                     | `npx skills add anivar/zod-testing -g`        |
| [redux-saga-testing](https://github.com/anivar/redux-saga-testing) | Redux-Saga testing — expectSaga, testSaga, providers                          | `npx skills add anivar/redux-saga-testing -g` |

### Library & Framework Skills

| Skill                                                          | What it covers                                    | Install                                     |
| -------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------- |
| [zod-skill](https://github.com/anivar/zod-skill)               | Zod v4 schema validation, parsing, error handling | `npx skills add anivar/zod-skill -g`        |
| [redux-saga-skill](https://github.com/anivar/redux-saga-skill) | Redux-Saga effects, fork model, channels, RTK     | `npx skills add anivar/redux-saga-skill -g` |

### Engineering Analysis

| Skill                                                                                    | What it covers                                     | Install                                                  |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| [contributor-codebase-analyzer](https://github.com/anivar/contributor-codebase-analyzer) | Code analysis, annual reviews, promotion readiness | `npx skills add anivar/contributor-codebase-analyzer -g` |

## Author

**[Anivar Aravind](https://anivar.net)** — Building AI agent skills for modern JavaScript/TypeScript development.

## License

MIT
