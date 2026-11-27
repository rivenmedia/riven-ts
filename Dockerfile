# Riven and its frontend, in a single image.
#
# Both apps run in the same container (see `docker/entrypoint.sh`). The frontend
# is the only port exposed, and it forwards `/graphql` and `/api/auth` to Riven
# over loopback, so neither app needs to know the other's address.

ARG HOME=/app
ARG NODE_VERSION=24.22.1
ARG TURBO_VERSION=2.11.4
ARG PNPM_VERSION=12.22.0
ARG PNPM_HOME=${HOME}/.local/share/pnpm
ARG PNPM_STORE=${PNPM_HOME}/store
ARG FRONTEND_DIR=apps/frontend
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

    RUN turbo prune @repo/riven @repo/frontend --docker

    # `permissions.*.skills` makes pnpm fetch full registry metadata, which is unavailable offline; skills aren't needed in the image
    RUN sed -i '/^permissions:/,/^[^ ]/{/^permissions:/d;/^ /d}' out/pnpm-workspace.yaml out/full/pnpm-workspace.yaml

FROM base AS third-party-deps

    LABEL builder="true"

    ARG HOME
    ARG PNPM_STORE

    ARG CI
    ENV CI=${CI}

    WORKDIR ${HOME}

    # Installs Riven's dependencies from the lockfile and package manifests only,
    # so source changes (including to workspace packages) never invalidate this
    # stage. Its output becomes the runtime image's `node_modules` layer, which
    # can then be reused.
    COPY --from=prepare ${HOME}/out/json/ ./
    COPY --from=prepare ${HOME}/.pnpmfile.mjs ./

    # Riven's deploy doesn't use the frontend's patches (e.g. `@msw/playwright`), which pnpm
    # rejects unless they're allowed to go unused.
    # Workspace packages are removed here and added from `production-deploy`
    # instead, where they have been built.
    # `.modules.yaml` is only read by pnpm and records a `prunedAt` timestamp.
    RUN --mount=type=cache,id=pnpm,target=${PNPM_STORE} \
        pnpm --filter @repo/riven --prod --config.allow-unused-patches=true deploy pruned && \
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

    RUN --mount=type=secret,id=TURBO_TOKEN,env=TURBO_TOKEN turbo run build --filter=@repo/riven --filter=@repo/frontend

FROM builder AS production-deploy

    LABEL builder="true"

    ARG HOME

    WORKDIR ${HOME}

    ARG CI
    ENV CI=${CI}

    # Only the built workspace packages are taken from this deploy; third-party
    # dependencies come from `third-party-deps`. Both deploys use the same
    # lockfile, so the `.pnpm` directory names match.
    RUN pnpm --filter @repo/riven --prod --config.allow-unused-patches=true deploy pruned && \
        mkdir -p workspace-packages/.pnpm && \
        mv pruned/node_modules/.pnpm/@repo+* workspace-packages/.pnpm/

# The runner is Debian-based rather than Alpine: the frontend's image resizing
# (`sharp`) fails silently on Alpine, falling back to the largest image in the
# srcset, and the native modules are built against glibc in the stages above.
FROM node:${NODE_VERSION}-slim AS runner

    LABEL name="Riven TS" \
          description="Riven(TS) Media Server, with its frontend" \
          url="https://github.com/rivenmedia/riven-ts" \
          stage="runner"

    ARG HOME
    ARG FRONTEND_DIR
    ARG USER
    ARG PUID
    ARG PGID

    ENV USERNAME=${USER}
    ENV USERGROUP=${USER}
    ENV PUID=${PUID}
    ENV PGID=${PGID}
    ENV HOME=${HOME}

    # - `fuse3` provides the setuid `fusermount` that the VFS's bundled libfuse mounts with, as
    #   Riven doesn't run as root. Debian ships it for FUSE 2 compatibility; `fuse` is only a
    #   transitional package. The build fails if it isn't setuid, as the VFS couldn't mount.
    # - `tini` runs as PID 1, reaping orphaned processes and passing signals to the entrypoint
    RUN apt-get update && \
        apt-get install -y --no-install-recommends fuse3 tini && \
        rm -rf /var/lib/apt/lists/* && \
        test -u "$(readlink -f "$(command -v fusermount)")"

    # Ensure user_allow_other is enabled in /etc/fuse.conf (needed for VFS to work properly)
    RUN sed -i 's/^#\s*user_allow_other/user_allow_other/' /etc/fuse.conf && \
        grep -q '^user_allow_other' /etc/fuse.conf || echo 'user_allow_other' >> /etc/fuse.conf

    # Replace the image's `node` user with one matching the desired UID/GID
    RUN userdel --remove node && \
        groupadd --gid ${PGID} ${USERGROUP} && \
        useradd --uid ${PUID} --gid ${USERGROUP} --home-dir ${HOME} --create-home --shell /usr/sbin/nologin ${USERNAME}

    WORKDIR ${HOME}

    USER ${PUID}:${PGID}

    # Riven runs from `HOME`, so its relative paths (such as `logs`) resolve to
    # `/app/logs` as before. Its layers are ordered from least to most
    # frequently changed, so a code change only replaces the small layers at the end:
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

    # The frontend's standalone output has its own `node_modules`, so it gets its
    # own directory rather than overwriting Riven's. It mirrors the monorepo's
    # structure, as `outputFileTracingRoot` expects. It's owned by the runtime
    # user, as Next.js writes its image cache to `.next/cache`.
    COPY --from=builder --chown=${PUID}:${PGID} ${HOME}/${FRONTEND_DIR}/.next/standalone ./frontend/
    COPY --from=builder --chown=${PUID}:${PGID} ${HOME}/${FRONTEND_DIR}/public ./frontend/${FRONTEND_DIR}/public
    COPY --from=builder --chown=${PUID}:${PGID} ${HOME}/${FRONTEND_DIR}/.next/static ./frontend/${FRONTEND_DIR}/.next/static

    COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/riven-entrypoint

    ENV NODE_ENV=production
    ENV NEXT_TELEMETRY_DISABLED=1
    ENV FRONTEND_DIR=${HOME}/frontend/${FRONTEND_DIR}

    # The port the frontend listens on
    ENV PORT=9000

    # Riven only needs to be reachable by the frontend, over loopback. `localhost`
    # isn't used, as it can resolve to `::1` for one app and `127.0.0.1` for the other.
    # Set `RIVEN_SETTING__host` to `0.0.0.0` to also expose Riven's API on port 3000.
    ENV RIVEN_SETTING__host=127.0.0.1

    EXPOSE 9000

    # Checks both apps at once, as the frontend forwards `/api/auth` to Riven
    HEALTHCHECK --interval=15s --timeout=3s --start-period=30s --retries=3 \
        CMD node -e "fetch('http://127.0.0.1:' + process.env.PORT + '/api/auth/ok').then((response) => process.exit(response.ok ? 0 : 1), () => process.exit(1))"

    ENTRYPOINT ["tini", "--", "riven-entrypoint"]
