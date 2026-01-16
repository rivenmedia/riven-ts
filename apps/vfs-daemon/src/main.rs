mod grpc_client;

use clap::Parser;
use fuser::{
    FileAttr, FileType, Filesystem, MountOption, ReplyAttr, ReplyData, ReplyDirectory, ReplyEmpty,
    ReplyEntry, ReplyOpen, Request,
};
use grpc_client::VfsGrpcClient;
use log::{debug, error, info};
use riven_vfs::SyncFilesRequest;
use std::collections::HashMap;
use std::ffi::OsStr;
use std::sync::{Arc, Mutex};
use std::time::SystemTime;
use tokio::runtime::Runtime;

const ROOT_INO: u64 = 1;

#[derive(Clone, Debug)]
pub struct FileEntry {
    pub name: String,
    pub url: String,
    pub size: u64,
}

#[derive(Clone)]
struct Catalog {
    files: Arc<Mutex<HashMap<u64, FileEntry>>>,
    ino_counter: Arc<Mutex<u64>>,
}

impl Catalog {
    fn new() -> Self {
        let mut files = HashMap::new();
        files.insert(
            ROOT_INO,
            FileEntry {
                name: "/".to_string(),
                url: String::new(),
                size: 0,
            },
        );

        Self {
            files: Arc::new(Mutex::new(files)),
            ino_counter: Arc::new(Mutex::new(ROOT_INO + 1)),
        }
    }

    fn add_file(&self, name: String, url: String, size: u64) -> u64 {
        let mut ino = self.ino_counter.lock().unwrap();
        let new_ino = *ino;

        *ino += 1;

        let entry = FileEntry { name, url, size };

        self.files.lock().unwrap().insert(new_ino, entry);

        new_ino
    }

    fn get(&self, ino: u64) -> Option<FileEntry> {
        self.files.lock().unwrap().get(&ino).cloned()
    }

    fn list_children(&self) -> Vec<(u64, FileEntry)> {
        let files = self.files.lock().unwrap();
        files
            .iter()
            .filter(|(ino, _)| **ino != ROOT_INO)
            .map(|(ino, entry)| (*ino, entry.clone()))
            .collect()
    }
}

#[derive(Clone)]
struct FileHandleInfo {
    ino: u64,
}

struct FileHandles {
    handles: Arc<Mutex<HashMap<u64, FileHandleInfo>>>,
    handle_counter: Arc<Mutex<u64>>,
}

impl FileHandles {
    fn new() -> Self {
        Self {
            handles: Arc::new(Mutex::new(HashMap::new())),
            handle_counter: Arc::new(Mutex::new(0)),
        }
    }

    fn open(&self, ino: u64) -> u64 {
        let mut counter = self.handle_counter.lock().unwrap();
        let handle = *counter;

        *counter += 1;

        self.handles
            .lock()
            .unwrap()
            .insert(handle, FileHandleInfo { ino });

        handle
    }

    fn get(&self, handle: u64) -> Option<FileHandleInfo> {
        self.handles.lock().unwrap().get(&handle).cloned()
    }

    fn close(&self, handle: u64) {
        self.handles.lock().unwrap().remove(&handle);
    }
}

struct StreamingFS {
    catalog: Catalog,
    handles: FileHandles,
    grpc_client: Arc<Mutex<VfsGrpcClient>>,
    runtime: Arc<Runtime>,
}

impl StreamingFS {
    fn new(catalog: Catalog, grpc_client: VfsGrpcClient, runtime: Runtime) -> Self {
        Self {
            catalog,
            handles: FileHandles::new(),
            grpc_client: Arc::new(Mutex::new(grpc_client)),
            runtime: Arc::new(runtime),
        }
    }

    async fn sync_files(&self) -> Result<(), Box<dyn std::error::Error>> {
        let mut client = self.grpc_client.lock().unwrap();

        let mut response = client.sync_files().await?;

        while let Some(file_info) = response.message().await? {
            let name = format!("item_{}", file_info.item_id);
            let url = format!("riven://item/{}", file_info.item_id);
            let size = 0;

            self.catalog.add_file(name, url, size);
        }

        Ok(())
    }

    fn file_attr(&self, ino: u64, entry: &FileEntry) -> FileAttr {
        let is_dir = ino == ROOT_INO;
        let mode = if is_dir { 0o755 } else { 0o444 };
        let kind = if is_dir {
            FileType::Directory
        } else {
            FileType::RegularFile
        };
        let now = SystemTime::now();

        FileAttr {
            ino,
            size: entry.size,
            blocks: (entry.size + 511) / 512,
            atime: now,
            mtime: now,
            ctime: now,
            crtime: now,
            kind,
            perm: mode,
            nlink: if is_dir { 2 } else { 1 },
            uid: unsafe { libc::getuid() },
            gid: unsafe { libc::getgid() },
            rdev: 0,
            flags: 0,
            blksize: 4096,
        }
    }
}

impl Filesystem for StreamingFS {
    fn lookup(&mut self, _req: &Request, parent: u64, name: &OsStr, reply: ReplyEntry) {
        debug!("lookup: parent={}, name={:?}", parent, name);

        if parent != ROOT_INO {
            reply.error(libc::ENOENT);
            return;
        }

        let children = self.catalog.list_children();

        for (ino, entry) in children {
            if entry.name == name.to_string_lossy().as_ref() {
                let attr = self.file_attr(ino, &entry);
                reply.entry(&std::time::Duration::from_secs(1), &attr, 0);
                return;
            }
        }

        reply.error(libc::ENOENT);
    }

    fn getattr(&mut self, _req: &Request, ino: u64, _fh: Option<u64>, reply: ReplyAttr) {
        debug!("getattr: ino={}", ino);

        if let Some(entry) = self.catalog.get(ino) {
            let attr = self.file_attr(ino, &entry);
            reply.attr(&std::time::Duration::from_secs(1), &attr);
        } else {
            reply.error(libc::ENOENT);
        }
    }

    fn readdir(
        &mut self,
        _req: &Request,
        ino: u64,
        _fh: u64,
        offset: i64,
        mut reply: ReplyDirectory,
    ) {
        debug!("readdir: ino={}, offset={}", ino, offset);

        if ino != ROOT_INO {
            reply.error(libc::ENOENT);

            return;
        }

        let mut entry_idx = 0;

        let dot_entries = vec![
            (ROOT_INO, FileType::Directory, "."),
            (ROOT_INO, FileType::Directory, ".."),
        ];

        for (child_ino, ty, name) in dot_entries {
            if entry_idx >= offset as usize {
                if reply.add(child_ino, (entry_idx + 1) as i64, ty, name) {
                    reply.ok();
                    return;
                }
            }
            entry_idx += 1;
        }

        let children = self.catalog.list_children();
        for (ino, entry) in children {
            if entry_idx >= offset as usize {
                if reply.add(
                    ino,
                    (entry_idx + 1) as i64,
                    FileType::RegularFile,
                    &entry.name,
                ) {
                    reply.ok();
                    return;
                }
            }
            entry_idx += 1;
        }

        reply.ok();
    }

    fn open(&mut self, _req: &Request, ino: u64, _flags: i32, reply: ReplyOpen) {
        debug!("open: ino={}", ino);

        if self.catalog.get(ino).is_none() {
            reply.error(libc::ENOENT);
            return;
        }

        let fh = self.handles.open(ino);
        reply.opened(fh, 0);
    }

    fn read(
        &mut self,
        _req: &Request,
        _ino: u64,
        fh: u64,
        offset: i64,
        size: u32,
        _flags: i32,
        _lock_owner: Option<u64>,
        reply: ReplyData,
    ) {
        debug!("read: fh={}, offset={}, size={}", fh, offset, size);

        let handle_info = match self.handles.get(fh) {
            Some(info) => info,
            None => {
                reply.error(libc::EBADF);
                return;
            }
        };

        let entry = match self.catalog.get(handle_info.ino) {
            Some(e) => e,
            None => {
                reply.error(libc::ENOENT);
                return;
            }
        };

        if offset as u64 >= entry.size {
            reply.data(&[]);
            return;
        }

        let bytes_to_read = ((offset as u64 + size as u64).min(entry.size) - offset as u64) as u32;

        let grpc_client_clone = self.grpc_client.clone();
        let url = entry.url.clone();
        let offset_u64 = offset as u64;

        let data = self.runtime.block_on(async {
            let mut client = grpc_client_clone.lock().unwrap();

            client
                .stream_file(url, offset_u64, bytes_to_read as u64, 1048576)
                .await
        });

        match data {
            Ok(bytes) => {
                debug!("Read {} bytes from gRPC stream", bytes.len());
                reply.data(&bytes);
            }
            Err(e) => {
                error!("Failed to stream file data: {}", e);
                reply.error(libc::EIO);
            }
        }
    }

    fn release(
        &mut self,
        _req: &Request,
        _ino: u64,
        fh: u64,
        _flags: i32,
        _lock_owner: Option<u64>,
        _flush: bool,
        reply: ReplyEmpty,
    ) {
        debug!("release: fh={}", fh);

        self.handles.close(fh);

        reply.ok();
    }
}

#[derive(Parser, Debug)]
#[command(name = "vfs-daemon")]
#[command(about = "FUSE filesystem for streaming media via gRPC")]
struct Args {
    #[arg(value_name = "MOUNT_POINT")]
    mountpoint: String,

    #[arg(short, long, default_value = "http://127.0.0.1:50051")]
    grpc_server: String,
}

#[tokio::main]
async fn main() {
    env_logger::Builder::from_default_env()
        .filter_level(log::LevelFilter::Info)
        .init();

    let args = Args::parse();

    let rt = Runtime::new().expect("Failed to create Tokio runtime");
    let grpc_client = VfsGrpcClient::new(args.grpc_server.clone());
    let catalog = Catalog::new();

    let mut options = vec![MountOption::RO, MountOption::FSName("vfs".to_string())];

    options.push(MountOption::AllowOther);
    options.push(MountOption::AutoUnmount);

    let fs = StreamingFS::new(catalog, grpc_client.clone(), rt);

    info!("Mounting VFS at {}", args.mountpoint);

    tokio::spawn(async move {
        let _response = grpc_client.clone().sync_files().await;

        info!("Synced files into VFS");
    });

    info!("VFS mounted at {}", args.mountpoint);

    match fuser::mount2(fs, &args.mountpoint, &options) {
        Ok(_) => info!("Filesystem unmounted"),
        Err(e) => error!("Mount error: {}", e),
    }
}
