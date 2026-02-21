FROM node:24-alpine AS base

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
    fuse3 \
    fuse3-dev \
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

# Copy workspace sources
COPY . .

# Install project dependencies
RUN pnpm install --frozen-lockfile

#---------------------------

FROM dependencies AS schema-generator

RUN pnpm -r generate-schemas

# ---------------------------

FROM schema-generator AS riven

COPY . .

EXPOSE 8080

STOPSIGNAL SIGINT

CMD [ "pnpm", "--filter=@repo/riven", "start" ]
