# Riven

Riven automates finding, downloading and serving media. This glossary fixes the
language used across the backend, the plugins and the frontend.

## Services

**External service**:
Any service Riven talks to that runs outside Riven itself and isn't its own
database or cache. This covers public APIs (such as TMDB, TVDB, Torrentio and
StremThru) as well as services the user hosts themselves (such as Plex,
Jellyfin and Seerr).
_Avoid_: third party, upstream, provider

## Settings

**Setting**:
One configurable value of Riven or a plugin, which has a stored value or falls
back to its default.
_Avoid_: option, config value

**Settings section**:
A named group of settings (Riven's own, or one plugin's) that is edited and
saved as a whole.
_Avoid_: settings page, settings group

**Served schema**:
The JSON Schema the backend sends to describe a settings section or ranking
profile, from which the form is rendered. The backend is authoritative over
what it accepts.
_Avoid_: form schema, settings config

**Reset**:
Removing a setting's stored value, so it returns to its default (or becomes
unset when it has none). Emptying a field resets it, except for secrets, locked
settings and nullable settings (an emptied nullable setting is saved as
`null`).
_Avoid_: clear, delete, revert

**Secret**:
A write-only setting, such as an API key, whose value is never sent back. A
blank secret is left unchanged; it is only reset explicitly.
_Avoid_: password field, sensitive setting

**Locked setting**:
A setting whose value comes from an environment variable, so it can't be
edited or reset from the UI.
_Avoid_: read-only setting, env setting
