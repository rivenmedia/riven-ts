pub mod catalog;
mod file_handles;
pub mod streaming_fs;

const ROOT_INO: u64 = 1;

use std::ffi::OsStr;

use fuser::{
    FileType, Filesystem, ReplyAttr, ReplyData, ReplyDirectory, ReplyEmpty, ReplyEntry, ReplyOpen,
    Request,
};
use log::{debug, error};
use tonic::async_trait;

use crate::filesystem::streaming_fs::StreamingFS;

#[async_trait]
impl Filesystem for StreamingFS {
    fn lookup(&mut self, _req: &Request, parent: u64, name: &OsStr, reply: ReplyEntry) {
        debug!("lookup: parent={}, name={:?}", parent, name);

        if parent != ROOT_INO {
            reply.error(libc::ENOENT);
            return;
        }

        if let Ok(cat) = self.catalog.lock() {
            let children = cat.list_children();

            for (ino, entry) in children {
                if entry.name == name.to_string_lossy().as_ref() {
                    let attr = self.file_attr(ino, &entry);
                    reply.entry(&std::time::Duration::from_secs(1), &attr, 0);
                    return;
                }
            }
        }

        reply.error(libc::ENOENT);
    }

    fn getattr(&mut self, _req: &Request, ino: u64, _fh: Option<u64>, reply: ReplyAttr) {
        debug!("getattr: ino={}", ino);

        if let Ok(cat) = self.catalog.lock() {
            if let Some(entry) = cat.get(ino) {
                let attr = self.file_attr(ino, &entry);
                reply.attr(&std::time::Duration::from_secs(1), &attr);
            } else {
                reply.error(libc::ENOENT);
            }
        } else {
            reply.error(libc::EIO);
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

        if let Ok(cat) = self.catalog.lock() {
            let children = cat.list_children();

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
        }

        reply.ok();
    }

    fn open(&mut self, _req: &Request, ino: u64, _flags: i32, reply: ReplyOpen) {
        debug!("open: ino={}", ino);

        let exists = if let Ok(cat) = self.catalog.lock() {
            cat.get(ino).is_some()
        } else {
            false
        };

        if !exists {
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

        let entry = {
            if let Ok(cat) = self.catalog.lock() {
                match cat.get(handle_info.ino) {
                    Some(e) => e,
                    None => {
                        reply.error(libc::ENOENT);
                        return;
                    }
                }
            } else {
                reply.error(libc::EIO);
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
            let mut client = grpc_client_clone
                .lock()
                .unwrap_or_else(|e| panic!("Failed to lock grpc_client: {}", e));

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
