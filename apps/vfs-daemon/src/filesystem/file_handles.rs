use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

#[derive(Clone)]
pub struct FileHandleInfo {
    pub ino: u64,
}

pub struct FileHandles {
    handles: Arc<Mutex<HashMap<u64, FileHandleInfo>>>,
    handle_counter: Arc<Mutex<u64>>,
}

impl FileHandles {
    pub fn new() -> Self {
        Self {
            handles: Arc::new(Mutex::new(HashMap::new())),
            handle_counter: Arc::new(Mutex::new(0)),
        }
    }

    pub fn open(&self, ino: u64) -> u64 {
        let mut counter = self
            .handle_counter
            .lock()
            .unwrap_or_else(|e| panic!("Failed to lock handle_counter: {}", e));

        let handle = *counter;

        *counter += 1;

        self.handles
            .lock()
            .unwrap_or_else(|e| panic!("Failed to lock handles: {}", e))
            .insert(handle, FileHandleInfo { ino });

        handle
    }

    pub fn get(&self, handle: u64) -> Option<FileHandleInfo> {
        self.handles
            .lock()
            .unwrap_or_else(|e| panic!("Failed to lock handles: {}", e))
            .get(&handle)
            .cloned()
    }

    pub fn close(&self, handle: u64) {
        self.handles
            .lock()
            .unwrap_or_else(|e| panic!("Failed to lock handles: {}", e))
            .remove(&handle);
    }
}
