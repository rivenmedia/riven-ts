FROM --platform=$BUILDPLATFORM node:24.15.0-alpine AS base

ARG TARGETPLATFORM
ARG BUILDPLATFORM

ARG TURBO_TEAM

ARG PUID
ARG PGID

ENV TURBO_TEAM=${TURBO_TEAM}
ENV PUID=${PUID:-1000}
ENV PGID=${PGID:-1000}
ENV USERNAME=riven
ENV USERGROUP=riven
ENV HOME=/home/${USERNAME}
ENV PNPM_HOME=${HOME}/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Install core dependencies and FUSE
RUN apk add --no-cache \
    wget \
    bash \
    fuse \
    fuse-dev \
    shadow

# Modify existing node user to match desired UID/GID
RUN deluser --remove-home node && \
    addgroup -g ${PGID} ${USERGROUP} && \
    adduser -D -u ${PUID} -G ${USERGROUP} -h ${HOME} ${USERNAME}

# Configure FUSE
RUN sed -i 's/^#\s*user_allow_other/user_allow_other/' /etc/fuse.conf || \
    echo 'user_allow_other' >> /etc/fuse.conf

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

#---------------------------

FROM --platform=$BUILDPLATFORM base AS dependencies

# Disable Husky Git hooks during installation
ENV HUSKY=0

# Install build dependencies
RUN apk add --no-cache \
    make \
    gcc \
    g++ \
    python3 \
    linux-headers

WORKDIR ${HOME}/riven-ts

# Copy dependency files
COPY .husky/install.mjs .husky/install.mjs
COPY pnpm-lock.yaml pnpm-workspace.yaml ./

# https://pnpm.io/cli/fetch
RUN pnpm fetch

COPY --parents **/package.json ./

RUN if [ "${TARGETPLATFORM}" = "linux/arm64" ]; then \
        apk add --no-cache git; \
        pnpm config set overrides --location project --json '{ "fuse-shared-library-linux": "github:runkit-forks/fuse-shared-library-linux-arm64" }'; \
    fi

# Install project dependencies
RUN pnpm install -r --prefer-offline

#---------------------------

FROM --platform=$BUILDPLATFORM dependencies AS riven-builder

COPY --chown=${PUID}:${PGID} . .

RUN --mount=type=secret,id=TURBO_TOKEN,env=TURBO_TOKEN pnpm turbo @repo/riven#build

FROM --platform=$BUILDPLATFORM riven-builder AS riven

EXPOSE 8080

STOPSIGNAL SIGINT

USER ${PUID}:${PGID}

CMD [ "pnpm", "--filter=@repo/riven", "start" ]
