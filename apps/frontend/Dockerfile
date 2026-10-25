ARG HOME=/app
ARG NODE_VERSION=24.15.0
ARG TURBO_VERSION=2.11.4
ARG PNPM_VERSION=12.15.0
ARG PNPM_HOME=${HOME}/.local/share/pnpm
ARG PNPM_STORE=${PNPM_HOME}/store
ARG APP_DIR=apps/frontend
ARG USER=riven
ARG PUID=1000
ARG PGID=1000
ARG CI=true

FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-slim AS core-os

    LABEL stage="core-os"

    ARG TARGETPLATFORM
    ARG BUILDPLATFORM

    # Install build dependencies
    RUN apt-get update && apt-get install -y \
        wget \
        fuse3 \
        libfuse3-dev \
        libfuse-dev \
        make \
        gcc \
        python3 \
        build-essential \
        git

FROM core-os AS base

    LABEL builder="true"

    ARG HOME
    ARG PNPM_HOME
    ARG PNPM_STORE
    ARG PNPM_VERSION
    ARG TURBO_VERSION

    ENV PNPM_HOME=${PNPM_HOME}
    ENV PATH=${PNPM_HOME}/bin:$PATH

    # Install pnpm
    RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

    RUN pnpm add turbo@${TURBO_VERSION} --global

    RUN --mount=type=cache,id=pnpm,target=${PNPM_STORE} pnpm config set store-dir ${PNPM_STORE}

    RUN turbo telemetry disable

FROM base AS prepare

    LABEL builder="true"

    ARG HOME

    WORKDIR ${HOME}

    COPY . .

    RUN turbo prune @repo/frontend --docker

FROM base AS builder

    LABEL builder="true"

    ARG HOME
    ARG PNPM_STORE

    ARG CI
    ENV CI=${CI}

    WORKDIR ${HOME}

    COPY --from=prepare ${HOME}/out/pnpm-lock.yaml ./
    COPY --from=prepare ${HOME}/out/pnpm-workspace.yaml ./
    COPY --from=prepare ${HOME}/out/json/patches ./patches

    RUN pnpm fetch

    COPY --from=prepare ${HOME}/out/full/ ./

    RUN --mount=type=cache,id=pnpm,target=${PNPM_STORE} pnpm --filter @repo/frontend install -r --offline

    # Replace the previous workspace file to avoid `build` from triggering an installation that fails the Docker process
    COPY --from=prepare ${HOME}/out/pnpm-workspace.yaml ./

    ARG TURBO_TEAM
    ENV TURBO_TEAM=${TURBO_TEAM}

    RUN --mount=type=secret,id=TURBO_TOKEN,env=TURBO_TOKEN turbo @repo/frontend#build

# The runner requires a slim image to provide tools such as `sharp` for image resizing;
# Don't use an `alpine` base as it fails silently when calling `_next/image` URLs,
# and will fall back to returning the largest image in the srcset.
FROM node:${NODE_VERSION}-slim AS runner

    LABEL name="Riven TS Frontend" \
          description="Riven(TS) Media Server Frontend" \
          url="https://github.com/rivenmedia/riven-ts" \
          stage="runner"

    ARG HOME
    ARG APP_DIR

    WORKDIR ${HOME}

    ENV NODE_ENV=production
    ENV PORT=9000
    ENV HOSTNAME="0.0.0.0"

    ENV NEXT_TELEMETRY_DISABLED=1

    # Automatically leverage output traces to reduce image size
    # https://nextjs.org/docs/advanced-features/output-file-tracing
    COPY --from=builder --chown=node:node ${HOME}/${APP_DIR}/.next/standalone ./

    # Mirror the project structure in the image's public files
    # to match what outputFileTracingRoot expects
    COPY --from=builder --chown=node:node ${HOME}/${APP_DIR}/public ./${APP_DIR}/public
    COPY --from=builder --chown=node:node ${HOME}/${APP_DIR}/.next/static ./${APP_DIR}/.next/static

    # Switch to non-root user for security best practices
    USER node

    EXPOSE 9000

    WORKDIR ${HOME}/${APP_DIR}

    # Start Next.js standalone server
    CMD ["node", "server.js"]
