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

# Install pnpm and Node.js
RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.bashrc" SHELL="$(which bash)" bash -
RUN pnpm env use --global 24

# Configure FUSE
RUN sed -i 's/^#\s*user_allow_other/user_allow_other/' /etc/fuse.conf || \
    echo 'user_allow_other' >> /etc/fuse.conf

#--------------------------

FROM base AS dependencies

# Disable Husky Git hooks during installation
ENV HUSKY=0

# Install build dependencies
RUN apt-get update && apt-get install -y make gcc python3 build-essential

# Copy project files
COPY . ${HOME}/riven-ts
WORKDIR ${HOME}/riven-ts

# Set ownership of home directory
RUN chown -R ${PUID}:${PGID} ${HOME}

# Install project dependencies
RUN pnpm install --frozen-lockfile

#---------------------------

FROM dependencies AS riven

# Copy built project to final image
COPY --from=dependencies --chown=${PUID}:${PGID} ${HOME} ${HOME}

# Switch to non-root user
# USER ${PUID}:${PGID}

EXPOSE 8080

STOPSIGNAL SIGINT

CMD [ "pnpm", "--filter=@repo/riven", "start" ]
