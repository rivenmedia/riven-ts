ARG HOME=/app
ARG NODE_VERSION=24.15.0
ARG TURBO_VERSION=2.9.14
ARG PNPM_VERSION=11.5.1
ARG PNPM_HOME=${HOME}/.local/share/pnpm
ARG PNPM_STORE=${PNPM_HOME}/store
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

    RUN turbo prune @repo/riven --docker

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

    RUN --mount=type=cache,id=pnpm,target=${PNPM_STORE} pnpm install -r --offline

    # Replace the previous workspace file to avoid `build` from triggering an installation that fails the Docker process
    COPY --from=prepare ${HOME}/out/pnpm-workspace.yaml ./

    ARG TURBO_TEAM
    ENV TURBO_TEAM=${TURBO_TEAM}

    RUN --mount=type=secret,id=TURBO_TOKEN,env=TURBO_TOKEN turbo @repo/riven#build

FROM builder AS production-deploy

    LABEL builder="true"

    ARG HOME

    WORKDIR ${HOME}

    ARG CI
    ENV CI=${CI}

    RUN pnpm --filter @repo/riven --prod deploy pruned

FROM node:${NODE_VERSION}-alpine AS runner

    LABEL name="Riven TS" \
          description="Riven(TS) Media Server" \
          url="https://github.com/rivenmedia/riven-ts" \
          stage="runner"

    ARG HOME

    WORKDIR ${HOME}

    ARG USER

    ENV USERNAME=${USER}
    ENV USERGROUP=${USER}

    ARG PUID
    ARG PGID

    ENV PUID=${PUID}
    ENV PGID=${PGID}

    ARG HOME
    ENV HOME=${HOME}

    # Modify existing node user to match desired UID/GID
    RUN deluser --remove-home node && \
        addgroup -g ${PGID} ${USERGROUP} && \
        adduser -D -u ${PUID} -G ${USERGROUP} -h ${HOME} ${USERNAME}

    # Install FUSE dependencies
    RUN apk add --no-cache \
        fuse \
        fuse-dev

    # Ensure user_allow_other is enabled in /etc/fuse.conf (needed for VFS to work properly)
    RUN sed -i 's/^#\s*user_allow_other/user_allow_other/' /etc/fuse.conf || \
        echo 'user_allow_other' >> /etc/fuse.conf

    USER ${PUID}:${PGID}

    COPY --from=production-deploy ${HOME}/pruned .

    ENV NODE_ENV=production

    CMD ["node", "--conditions=production", "--enable-source-maps", "dist/lib/index.js"]
