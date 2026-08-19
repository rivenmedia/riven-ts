# @repo/riven-tui

A terminal UI client for a running Riven instance, built with [Ink](https://github.com/vadimdemedes/ink).

It talks to the `@repo/riven` GraphQL API over HTTP - it does not run any Riven code itself, so it can be pointed at any running instance.

## Usage

```sh
pnpm --filter @repo/riven-tui dev
```

Configure the target instance with environment variables (see `.env.riven-tui.example`):

- `RIVEN_TUI_SETTING__graphqlUrl` - the GraphQL endpoint of the Riven instance (defaults to `http://localhost:3000/`)

## Features

- **Library** - browse the top-level items (movies and shows) in your library.
- **Item detail** - drill into a movie, show, season, or episode to see its state and, for shows and seasons, its children.
- **Actions** - an extensible action registry (see `lib/actions`) provides the foundation for wiring up real mutations (retry, delete, etc.) once they're finalized in the GraphQL API. The actions currently registered are mocks.
