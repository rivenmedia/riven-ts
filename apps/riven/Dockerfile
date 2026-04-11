FROM node:24.14.0-alpine AS base

ARG PUID
ARG PGID

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

FROM base AS dependencies

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

# Install project dependencies
RUN pnpm install -r --offline

#---------------------------

FROM dependencies AS riven-builder

COPY --chown=${PUID}:${PGID} . .

RUN pnpm turbo @repo/riven#build

FROM riven-builder AS riven

EXPOSE 8080

STOPSIGNAL SIGINT

USER ${PUID}:${PGID}

ENV NODE_ENV=${NODE_ENV:-production}

CMD [ "pnpm", "--filter=@repo/riven", "start" ]
