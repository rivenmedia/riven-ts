ARG HOME=/app
ARG NODE_VERSION=24.15.0
ARG TURBO_VERSION=2.9.5
ARG PNPM_VERSION=10.28.2
ARG PNPM_HOME=${HOME}/.local/share/pnpm
ARG USER=riven
ARG PUID=1000
ARG PGID=1000
ARG CI=true

FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-slim AS core-os

    LABEL stage="core-os"

    ARG TARGETPLATFORM
    ARG BUILDPLATFORM
    ARG USER
    ARG PNPM_VERSION
    ARG PNPM_HOME
    ARG HOME

    ENV PNPM_HOME=${PNPM_HOME}
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

    # Needed to install the ARM64 version of the fuse-shared-library dependency,
    # which is required for the VFS to work properly on ARM64 platforms
    RUN if [ "${TARGETPLATFORM}" = "linux/arm64" ]; then \
            apt-get install -y git; \
        fi

    # Install pnpm
    RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

FROM core-os AS prepare

    LABEL builder="true"

    ARG TURBO_VERSION
    ARG HOME

    WORKDIR ${HOME}

    RUN pnpm add turbo@${TURBO_VERSION} --global
    RUN turbo telemetry disable

    COPY . .

    RUN turbo prune @repo/riven --docker

FROM core-os AS builder

    LABEL builder="true"

    ARG HOME

    WORKDIR ${HOME}

    COPY --from=prepare ${HOME}/out/json/ .


    RUN pnpm fetch

    ARG CI
    ENV CI=${CI}

    RUN pnpm install -r --prefer-offline

    COPY --from=prepare ${HOME}/out/full/ .

    ARG TURBO_TEAM
    ENV TURBO_TEAM=${TURBO_TEAM}

    RUN --mount=type=secret,id=TURBO_TOKEN,env=TURBO_TOKEN pnpm turbo @repo/riven#build

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

    STOPSIGNAL SIGTERM

    CMD ["sh", "-c", "NODE_ENV=production node --conditions=production --enable-source-maps dist/program/lib/index.js"]
