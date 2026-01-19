FROM guergeiro/pnpm:24-10 AS builder

RUN apt-get update && apt-get install -y fuse libfuse-dev

FROM builder
WORKDIR /riven-ts
ENV HUSKY=0
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install
EXPOSE 3000
ENTRYPOINT [ "pnpm", "--filter=@repo/riven", "dev" ]
