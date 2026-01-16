# gRPC VFS Quick Start Guide

## ✅ System Status

**Implementation**: Complete and ready to use
**Last Updated**: January 15, 2026

## Prerequisites

- Linux with FUSE support
- Node.js 20+ (for Riven backend)
- Rust 1.70+ (for daemon compilation)
- protobuf-compiler installed

```bash
# Install protobuf compiler if needed
sudo apt-get install -y protobuf-compiler
```

## Installation

```bash
# 1. Install Node.js dependencies
pnpm install

# 2. Build the Rust daemon
cd apps/vfs-daemon
cargo build --release
cd ../..
```

## Running the System

### Step 1: Start the gRPC Backend (Riven)

```bash
# In terminal 1
cd apps/riven
ENABLE_GRPC_VFS=true GRPC_VFS_SERVER_ADDR=0.0.0.0:50051 pnpm dev
```

Expected output:

```
gRPC VFS server listening on 0.0.0.0:50051
Ready to stream media files...
```

### Step 2: Mount the FUSE Filesystem

```bash
# In terminal 2
mkdir -p ~/vfs_mount

# Mount with example catalog
./apps/vfs-daemon/target/release/vfs-daemon ~/vfs_mount \
  --grpc-server http://127.0.0.1:50051 \
  --catalog example_catalog.json \
  --auto-unmount
```

Expected output:

```
[INFO] Loading catalog from file: example_catalog.json
[INFO] Added file: test.txt (ino=2)
[INFO] Added file: sample.bin (ino=3)
[INFO] Mounting VFS at /home/joe/vfs_mount
```

### Step 3: Test File Access

```bash
# In terminal 3

# List files
ls -lah ~/vfs_mount
# Output:
# -r--r--r-- 1 joe joe  13K Jan 15 20:00 test.txt
# -r--r--r-- 1 joe joe 1.0M Jan 15 20:00 sample.bin

# Read a small file
cat ~/vfs_mount/test.txt | head -c 100

# Check file sizes
stat ~/vfs_mount/sample.bin

# Stream a larger file
dd if=~/vfs_mount/sample.bin of=/dev/null bs=1M count=1
```

## Testing the gRPC Streaming

Monitor the logs in both terminals:

**Terminal 1 (Backend):**

```
StreamFile request: url="https://proof.ovh.net/files/1Mb.dat" offset=0 length=1048576
Fetching range: bytes=0-1048575
Sending chunk 0: 1048576 bytes
Stream completed: 1 chunks, 1048576 bytes total
```

**Terminal 2 (Daemon):**

```
[DEBUG] read: fh=1, offset=0, size=1048576
[DEBUG] Starting gRPC stream for sample.bin
[DEBUG] Received chunk 0: 1048576 bytes
[DEBUG] Stream completed, returning 1048576 bytes
```

## Unmounting

```bash
# Gracefully unmount
fusermount -u ~/vfs_mount

# Or use Ctrl+C in the daemon terminal (auto-unmount enabled)
```

## Configuration

### Environment Variables (Backend)

Create `.env` in `apps/riven/`:

```env
ENABLE_GRPC_VFS=true
GRPC_VFS_SERVER_ADDR=0.0.0.0:50051
GRPC_VFS_CHUNK_SIZE=1048576
```

### Command-Line Args (Daemon)

```bash
vfs-daemon <MOUNT_POINT> [OPTIONS]

Options:
  --grpc-server <URL>      Backend gRPC server URL [default: http://127.0.0.1:50051\]
  --catalog <FILE>         JSON file with file catalog
  --allow-other            Allow other users to access the filesystem
  --auto-unmount           Auto-unmount on daemon exit
  -h, --help              Print help
```

## Catalog Format

Create a JSON file with your media files:

```json
[
  {
    "name": "movie.mp4",
    "url": "https://cdn.example.com/movies/movie.mp4",
    "size": 5368709120
  },
  {
    "name": "show-s01e01.mkv",
    "url": "https://s3.example.com/shows/episode1.mkv",
    "size": 2147483648
  }
]
```

**Fields:**

- `name`: Filename as it appears in the VFS
- `url`: Direct HTTP/HTTPS URL to the file
- `size`: File size in bytes (used for accurate stat() calls)

## Performance Tuning

### Chunk Size

Default: 1MB (1048576 bytes)

Adjust based on your use case:

```env
# Small chunks (256KB) - Better for seeking, higher overhead
GRPC_VFS_CHUNK_SIZE=262144

# Medium chunks (1MB) - Balanced (recommended)
GRPC_VFS_CHUNK_SIZE=1048576

# Large chunks (5MB) - Better throughput, higher memory
GRPC_VFS_CHUNK_SIZE=5242880
```

### Connection Pooling

The gRPC connection is persistent - the daemon maintains a single HTTP/2 connection to the backend, reused for all file operations.

## Troubleshooting

### "gRPC server not responding"

**Problem:** Daemon can't connect to backend

**Solutions:**

1. Verify backend is running: `netstat -tuln | grep 50051`
2. Check firewall: `sudo ufw allow 50051`
3. Verify address: `--grpc-server http://127.0.0.1:50051` (not https)

### "Transport endpoint not connected"

**Problem:** Old FUSE mount exists

**Solution:**

```bash
fusermount -u ~/vfs_mount
rm -rf ~/vfs_mount
mkdir ~/vfs_mount
```

### "Permission denied" when accessing files

**Problem:** File permissions or FUSE user permissions

**Solutions:**

1. Use `--allow-other` flag when mounting
2. Check `/etc/fuse.conf` has `user_allow_other` uncommented
3. Verify file URLs are accessible: `curl -I <url>`

### Files appear but can't be read

**Problem:** Backend can't fetch from URLs

**Solutions:**

1. Check backend logs for HTTP errors
2. Verify URLs are publicly accessible
3. Test: `curl -r 0-1000 <url>` (test Range header support)

## Advanced Usage

### Custom Backend Address

```bash
# Connect to remote backend
./apps/vfs-daemon/target/release/vfs-daemon ~/vfs_mount \
  --grpc-server http://192.168.1.100:50051 \
  --catalog my_files.json
```

### Multiple Mounts

```bash
# Mount different catalogs to different directories
./vfs-daemon ~/movies --catalog movies.json &
./vfs-daemon ~/shows --catalog shows.json &
```

### Systemd Service

Create `/etc/systemd/system/vfs-daemon.service`:

```ini
[Unit]
Description=gRPC VFS Daemon
After=network.target

[Service]
Type=simple
User=joe
ExecStart=/home/joe/www/riven-ts/apps/vfs-daemon/target/release/vfs-daemon \
  /mnt/media \
  --grpc-server http://127.0.0.1:50051 \
  --catalog /etc/vfs/catalog.json \
  --auto-unmount
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable:

```bash
sudo systemctl enable vfs-daemon
sudo systemctl start vfs-daemon
```

## Architecture Overview

```
User Application (cat, VLC, etc.)
        ↓
FUSE Kernel Module
        ↓
Rust VFS Daemon (FUSE userspace)
        ↓ gRPC/HTTP2 (persistent connection)
Node.js Backend (Riven)
        ↓ HTTP Range Requests
External CDN/S3/Storage
```

**Benefits:**

- Single persistent connection (no per-chunk overhead)
- 1MB chunks by default (configurable)
- Efficient HTTP Range header streaming
- Full separation between FUSE layer and HTTP logic

## Next Steps

1. **Connect to Real Database**: Replace JSON catalog with database queries
2. **Add Monitoring**: Integrate Prometheus metrics
3. **Enable TLS**: Use `https://` for backend connection
4. **Scale**: Run multiple daemon instances with load balancing

---

\*_Ready to use/home/joe/www/riven-ts/example_catalog.json_ 🚀

For detailed implementation info, see:

- `GRPC_VFS_IMPLEMENTATION.md` - Full technical documentation
- `GRPC_VFS_STATUS.md` - Implementation status report
- `apps/vfs-daemon/README.md` - Daemon-specific docs
