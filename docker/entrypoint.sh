#!/usr/bin/env bash
#
# Runs Riven and the frontend side by side in the unified image.
#
# The container stops as soon as either app exits, so Docker's restart policy
# restarts them together rather than leaving one running without the other.

set -euo pipefail

: "${FRONTEND_DIR:?must be set to the directory of the frontend}"

# Riven authenticates the frontend's shared requests with its API key. If no key
# is configured, one is generated for this run, as Riven would generate its own
# otherwise, and the frontend would have no way to know it.
if [[ -z "${RIVEN_SETTING__apiKey:-}" ]]; then
  RIVEN_SETTING__apiKey="$(node -p 'require("node:crypto").randomBytes(32).toString("base64url")')"

  echo "RIVEN_SETTING__apiKey is not set, so an API key was generated for this run." \
    "External callers such as Seerr and the TUI cannot authenticate until a key is set." >&2
fi

export RIVEN_SETTING__apiKey

# The frontend reaches Riven over loopback. These aren't configurable, so stale
# values from a separate frontend container's environment can't point it elsewhere.
export BACKEND_URL="http://127.0.0.1:${RIVEN_SETTING__port:-3000}"
export BACKEND_API_KEY="${RIVEN_SETTING__apiKey}"

node --conditions=production --enable-source-maps dist/lib/index.js &
riven_pid=$!

# Docker sets `HOSTNAME` to the container ID, which Next.js would otherwise bind to
(cd "${FRONTEND_DIR}" && HOSTNAME=0.0.0.0 exec node server.js) &
frontend_pid=$!

stopping=false

stop() {
  if [[ "${stopping}" == true ]]; then
    return
  fi

  stopping=true
  kill -TERM "${riven_pid}" "${frontend_pid}" 2> /dev/null || true
}

trap stop TERM INT

set +e

# Returns once either app exits, or once a trapped signal has been handled
wait -n "${riven_pid}" "${frontend_pid}"
status=$?

# Give both apps the chance to shut down cleanly, so Riven can unmount the VFS
stop
wait

exit "${status}"
