ARG NODE_VERSION=24.15.0
ARG TURBO_VERSION=2.9.5
ARG PNPM_VERSION=10.28.2
ARG USER=riven
ARG PUID=1000
ARG PGID=1000
ARG HOME=/app

FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-slim AS base

    LABEL stage="core-os"

    ARG TARGETPLATFORM
    ARG BUILDPLATFORM
    ARG USER
    ARG PNPM_VERSION
    ARG HOME

    ENV PNPM_HOME=${HOME}/.local/share/pnpm
    ENV PATH=$PNPM_HOME:$PATH

    # Install build dependencies
    RUN apt-get update && apt-get install -y \
        wget \
        fuse3 \
        libfuse3-dev \
        libfuse-dev \
        make \
        gcc \
        python3 \
        build-essential

    # Install pnpm
    RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

#---------------------------

FROM base AS prepare

    LABEL builder="true"

    ARG TURBO_VERSION
    ARG HOME

    WORKDIR ${HOME}

    RUN pnpm add turbo@${TURBO_VERSION} --global
    RUN turbo telemetry disable

    COPY . .

    RUN turbo prune @repo/riven --docker

FROM base AS builder

    LABEL builder="true"

    ARG HOME

    WORKDIR ${HOME}

    COPY --from=prepare ${HOME}/out/json/ .

    RUN pnpm fetch
    RUN if [ "${TARGETPLATFORM}" = "linux/arm64" ]; then \
            apt-get install -y git; \
            pnpm config set overrides --location project --json '{ "fuse-shared-library-linux": "github:runkit-forks/fuse-shared-library-linux-arm64" }'; \
        fi
    RUN pnpm install -r --prefer-offline

    COPY --from=prepare ${HOME}/out/full/ .

    ARG TURBO_TEAM
    ENV TURBO_TEAM=${TURBO_TEAM}

    RUN --mount=type=secret,id=TURBO_TOKEN,env=TURBO_TOKEN pnpm turbo @repo/riven#build

#---------------------------

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

    COPY --from=builder --chown=${PUID}:${PGID} ${HOME} .

    STOPSIGNAL SIGTERM

    WORKDIR ${HOME}/apps/riven

    CMD ["node", "--conditions=production", "--enable-source-maps", "dist/program/index.js"]
