{
  description = "Riven development environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";

  outputs = { nixpkgs, ... }:
    let
      systems = [ "x86_64-linux" "aarch64-linux" ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (system:
        let pkgs = nixpkgs.legacyPackages.${system};
        in {
          default = pkgs.mkShell {
            packages = with pkgs; [
              pnpm
              nodejs
              valkey # for running tests with redis
              fuse
            ];
            shellHook = ''
              export PATH="$PWD/node_modules/.bin:$PWD/.direnv/scripts:$PATH"
              FUSE_LIB_DIR=$(echo "$PWD"/node_modules/.pnpm/fuse-shared-library-linux@*/node_modules/fuse-shared-library-linux/libfuse/lib)
              if [ -d "$FUSE_LIB_DIR" ]; then
                ln -sf "$FUSE_LIB_DIR/libfuse.so" "$FUSE_LIB_DIR/libfuse.so.2" 2>/dev/null || true
                export LD_LIBRARY_PATH="$FUSE_LIB_DIR:$LD_LIBRARY_PATH"
              fi

              # Start docker compose services if not already running
              if ! docker compose ps -q 2>/dev/null | grep -q .; then
                echo "Starting docker compose services..."
                docker compose --profile services up -d
                docker compose --profile analytics up -d
              fi

              # Direnv doesn't support aliases, so we create a script that runs the dev command and add it to the PATH
              mkdir -p "$PWD/.direnv/scripts"
              cat > "$PWD/.direnv/scripts/dev" << 'SCRIPT'
              #!/usr/bin/env bash
              exec pnpm --filter @repo/riven dev "$@"
              SCRIPT
              chmod +x "$PWD/.direnv/scripts/dev"
            '';
          };
        }
      );
    };
}
