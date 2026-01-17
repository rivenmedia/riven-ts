use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

use log::info;
use riven_vfs::FileEntry;

use crate::filesystem::ROOT_INO;

#[derive(Clone)]
pub struct Catalog {
    files: Arc<Mutex<HashMap<u64, FileEntry>>>,
    file_inos: Arc<Mutex<HashMap<u64, u64>>>,
    ino_counter: Arc<Mutex<u64>>,
}

impl Catalog {
    pub fn new() -> Self {
        let mut files = HashMap::new();

        files.insert(
            ROOT_INO,
            FileEntry {
                name: "/".to_string(),
                url: String::new(),
                size: 0,
                id: 0,
                mime_type: String::from("None"),
                modified_time: 0,
            },
        );

        let file_inos = HashMap::<u64, u64>::new();

        Self {
            files: Arc::new(Mutex::new(files)),
            file_inos: Arc::new(Mutex::new(file_inos)),
            ino_counter: Arc::new(Mutex::new(ROOT_INO + 1)),
        }
    }

    fn acquire_files_lock(&self) -> std::sync::MutexGuard<'_, HashMap<u64, FileEntry>> {
        self.files
            .lock()
            .unwrap_or_else(|e| panic!("Failed to lock files: {}", e))
    }

    fn acquire_file_inos_lock(&self) -> std::sync::MutexGuard<'_, HashMap<u64, u64>> {
        self.file_inos
            .lock()
            .unwrap_or_else(|e| panic!("Failed to lock file inos: {}", e))
    }

    pub fn add_file(&self, file_id: u64, name: String, url: String, size: u64) -> Option<u64> {
        let mut ino = self
            .ino_counter
            .lock()
            .unwrap_or_else(|e| panic!("Failed to lock ino_counter: {}", e));

        let new_ino = *ino;

        *ino += 1;

        let entry = FileEntry {
            name,
            url,
            size,
            id: file_id,
            mime_type: String::from("None"),
            modified_time: 0,
        };

        self.acquire_files_lock().insert(new_ino, entry);
        self.acquire_file_inos_lock().insert(file_id, new_ino);

        Some(new_ino)
    }

    pub fn remove_file(&self, file_id: u64) -> Option<u64> {
        match self
            .file_inos
            .lock()
            .unwrap_or_else(|e| panic!("Failed to lock file_inos: {}", e))
            .get(&file_id)
        {
            Some(ino) => {
                info!("Removing file with ino={}, file_id={}", ino, file_id);

                self.acquire_files_lock().remove(ino);

                return Some(*ino);
            }
            None => {
                return None;
            }
        };
    }

    pub fn get(&self, ino: u64) -> Option<FileEntry> {
        self.acquire_files_lock().get(&ino).cloned()
    }

    pub fn list_children(&self) -> Vec<(u64, FileEntry)> {
        self.acquire_files_lock()
            .iter()
            .filter(|(ino, _)| **ino != ROOT_INO)
            .map(|(ino, entry)| (*ino, entry.clone()))
            .collect()
    }
}
