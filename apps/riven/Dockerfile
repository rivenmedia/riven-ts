ARG HOME=/app
ARG NODE_VERSION=24.22.1
ARG TURBO_VERSION=2.11.4
ARG PNPM_VERSION=12.15.0
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

FROM base AS third-party-deps

    LABEL builder="true"

    ARG HOME
    ARG PNPM_STORE

    ARG CI
    ENV CI=${CI}

    WORKDIR ${HOME}

    # Installs from the lockfile and package manifests only, so source changes
    # (including to workspace packages) never invalidate this stage. Its output
    # becomes the runtime image's `node_modules` layer, which can then be reused.
    COPY --from=prepare ${HOME}/out/json/ ./
    COPY --from=prepare ${HOME}/.pnpmfile.mjs ./

    # Workspace packages are removed here and added from `production-deploy`
    # instead, where they have been built.
    # `.modules.yaml` is only read by pnpm and records a `prunedAt` timestamp.
    RUN --mount=type=cache,id=pnpm,target=${PNPM_STORE} \
        pnpm --filter @repo/riven --prod deploy pruned && \
        rm -rf pruned/node_modules/.modules.yaml pruned/node_modules/.pnpm/@repo+*

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

    # `turbo prune` leaves out the pnpmfile, but the lockfile records its checksum
    COPY --from=prepare ${HOME}/.pnpmfile.mjs ./

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

    # Only the built workspace packages are taken from this deploy; third-party
    # dependencies come from `third-party-deps`. Both deploys use the same
    # lockfile, so the `.pnpm` directory names match.
    RUN pnpm --filter @repo/riven --prod deploy pruned && \
        mkdir -p workspace-packages/.pnpm && \
        mv pruned/node_modules/.pnpm/@repo+* workspace-packages/.pnpm/

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

    # Layers are ordered from least to most frequently changed, so a code change
    # only replaces the small layers at the end:
    #   1. third-party dependencies (change with the lockfile)
    #   2. workspace packages (change with `packages/*`)
    #   3. the app itself
    COPY --from=third-party-deps ${HOME}/pruned/node_modules ./node_modules
    COPY --from=production-deploy ${HOME}/workspace-packages/ ./node_modules/
    COPY --from=production-deploy ${HOME}/pruned/package.json ./
    COPY --from=production-deploy ${HOME}/pruned/dist ./dist

    # Fail the build if the two deploys disagreed on a package's location
    RUN broken="$(find -L node_modules -type l)" && \
        if [ -n "$broken" ]; then echo "Broken symlinks:"; echo "$broken"; exit 1; fi

    ENV NODE_ENV=production

    CMD ["node", "--conditions=production", "--enable-source-maps", "dist/lib/index.js"]
