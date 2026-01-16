# VFS Daemon - FUSE Filesystem for gRPC Streaming

A FUSE filesystem daemon that streams media files via gRPC from a remote backend server.

## Quick Start

### Build

```bash
cargo build --release
```

### Run

```bash
# Create mount point
mkdir -p ~/mnt/vfs

# Run daemon with default settings
./target/release/vfs-daemon ~/mnt/vfs

# In another terminal, access files
ls ~/mnt/vfs
```

### Mount with Catalog

Create `catalog.json`:

```json
[
  {
    "name": "movie.mp4",
    "url": "https://example.com/video.mp4",
    "size": 1073741824
  }
]
```

Mount with catalog:

```bash
./target/release/vfs-daemon ~/mnt/vfs --catalog catalog.json
```

## Options

- `--grpc-server <ADDR>`: gRPC server address (default: `http://127.0.0.1:50051`)
- `--catalog <FILE>`: JSON file with static file catalog
- `--allow-other`: Allow other users to access the mount
- `--auto-unmount`: Automatically unmount on exit

## Usage Example

```bash
# Mount with all options
./target/release/vfs-daemon /mnt/vfs \
  --grpc-server http://backend.example.com:50051 \
  --catalog files.json \
  --allow-other \
  --auto-unmount

# Test file operations
ls -la /mnt/vfs
stat /mnt/vfs/filename
cat /mnt/vfs/filename | head -c 1000
```

## Architecture

- **VfsGrpcClient**: Manages persistent gRPC connection to backend
- **StreamingFS**: Implements FUSE filesystem operations
- **Tokio Runtime**: Bridges async gRPC with sync FUSE callbacks

## Performance

- Default chunk size: 1 MB
- Single persistent gRPC connection (HTTP/2)
- Supports concurrent file reads
- HTTP Range header support for efficient streaming

## Environment Variables

- `RUST_LOG=debug`: Enable debug logging

## Development

```bash
# Run tests
cargo test

# Build with debug info
cargo build

# Build optimized release
cargo build --release --opt-level 3

# Check code
cargo clippy
```

## Troubleshooting

**FUSE mount fails**: Ensure FUSE is installed and `/dev/fuse` is readable
**Permission denied**: Add yourself to `fuse` group: `sudo usermod -a -G fuse $USER`
**gRPC connection error**: Verify backend server is running on the configured address

## See Also

- [GRPC_VFS_IMPLEMENTATION.md](../../GRPC_VFS_IMPLEMENTATION.md) - Full documentation
- [proto-vfs package](../../packages/proto-vfs/) - Protocol definitions
- [gRPC server](../../apps/riven/lib/grpc-vfs-server.ts) - Backend implementation
