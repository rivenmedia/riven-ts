use std::{
    sync::{Arc, Mutex},
    time::SystemTime,
};

use fuser::{FileAttr, FileType};
use libc::{getgid, getuid};
use riven_vfs::FileEntry;
use tokio::runtime::Runtime;

use crate::{
    filesystem::{catalog::Catalog, file_handles::FileHandles, ROOT_INO},
    grpc_client::VfsGrpcClient,
};

pub struct StreamingFS {
    pub catalog: Arc<Mutex<Catalog>>,
    pub handles: FileHandles,
    pub grpc_client: Arc<Mutex<VfsGrpcClient>>,
    pub runtime: Arc<Runtime>,
}

impl StreamingFS {
    pub fn new(
        catalog: Arc<Mutex<Catalog>>,
        grpc_client: Arc<Mutex<VfsGrpcClient>>,
        runtime: Runtime,
    ) -> Self {
        Self {
            catalog,
            handles: FileHandles::new(),
            grpc_client,
            runtime: Arc::new(runtime),
        }
    }

    /// Generate file attributes for a given inode and file entry
    pub fn file_attr(&self, ino: u64, entry: &FileEntry) -> FileAttr {
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
            uid: unsafe { getuid() },
            gid: unsafe { getgid() },
            rdev: 0,
            flags: 0,
            blksize: 4096,
        }
    }
}
