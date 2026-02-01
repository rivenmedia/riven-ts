FROM ubuntu:25.10 AS base

ARG PUID
ARG PGID

ENV PUID=${PUID:-1000}
ENV PGID=${PGID:-1000}
ENV USERNAME=riven
ENV USERGROUP=riven
ENV HOME=/home/${USERNAME}
ENV PNPM_HOME=${HOME}/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Create user and group
RUN usermod --login riven ubuntu
RUN groupmod -n ${USERGROUP} ubuntu
RUN mv /home/ubuntu ${HOME}
RUN chown -R ${PUID}:${PGID} ${HOME}

# Install core dependencies
RUN apt-get update && apt-get install -y wget fuse3 libfuse3-dev libfuse-dev

# Configure FUSE
RUN sed -i 's/^#\s*user_allow_other/user_allow_other/' /etc/fuse.conf || \
    echo 'user_allow_other' >> /etc/fuse.conf

# Install pnpm and Node.js
RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -
RUN pnpm env use --global 24

#---------------------------

FROM base AS dependencies

# Disable Husky Git hooks during installation
ENV HUSKY=0

# Install build dependencies
RUN apt-get update && apt-get install -y make gcc python3 build-essential

WORKDIR ${HOME}/riven-ts

# Copy dependency files
COPY .husky/install.mjs .husky/install.mjs
COPY pnpm-workspace.yaml .
COPY pnpm-lock.yaml .
COPY --parents **/package.json ./

# Install project dependencies
RUN pnpm install --frozen-lockfile

#---------------------------

FROM dependencies AS schema-generator

COPY --parents --from=dependencies ${HOME}/riven-ts/**/node_modules ./node_modules/
COPY --parents **/kubb.config.ts ./
COPY ./packages/core/util-kubb-config ./packages/core/util-kubb-config

RUN pnpm -r generate-schemas

# ---------------------------

FROM dependencies AS riven

# Copy built project to final image
COPY --parents --from=dependencies ${HOME}/riven-ts/**/node_modules ./node_modules/
COPY --parents --from=schema-generator ${HOME}/riven-ts/**/__generated__ ./__generated__
COPY . .

EXPOSE 8080

STOPSIGNAL SIGINT

CMD [ "pnpm", "--filter=@repo/riven", "start" ]
