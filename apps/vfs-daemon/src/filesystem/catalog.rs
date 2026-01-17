use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

use log::info;
use riven_vfs::FileEntry;

use crate::filesystem::ROOT_INO;

#[derive(Clone)]
pub struct Catalog {
    file_ino_to_entry_map: Arc<Mutex<HashMap<u64, FileEntry>>>,
    file_id_to_ino_map: Arc<Mutex<HashMap<u64, u64>>>,
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
            file_ino_to_entry_map: Arc::new(Mutex::new(files)),
            file_id_to_ino_map: Arc::new(Mutex::new(file_inos)),
            ino_counter: Arc::new(Mutex::new(ROOT_INO + 1)),
        }
    }

    /// Acquire lock for `file_ino_to_entry_map`
    fn acquire_file_ino_to_entry_map_lock(
        &self,
    ) -> std::sync::MutexGuard<'_, HashMap<u64, FileEntry>> {
        self.file_ino_to_entry_map
            .lock()
            .unwrap_or_else(|e| panic!("Failed to lock file ino to entry map: {}", e))
    }

    /// Acquire lock for `file_id_to_ino_map`
    fn acquire_file_id_to_ino_map_lock(&self) -> std::sync::MutexGuard<'_, HashMap<u64, u64>> {
        self.file_id_to_ino_map
            .lock()
            .unwrap_or_else(|e| panic!("Failed to lock file id to ino map: {}", e))
    }

    /// Add a new file to the catalog
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

        self.acquire_file_ino_to_entry_map_lock()
            .insert(new_ino, entry);

        self.acquire_file_id_to_ino_map_lock()
            .insert(file_id, new_ino);

        Some(new_ino)
    }

    /// Remove a file from the catalog by its file ID
    pub fn remove_file(&self, file_id: u64) -> Option<u64> {
        match self
            .file_id_to_ino_map
            .lock()
            .unwrap_or_else(|e| panic!("Failed to lock file_inos: {}", e))
            .get(&file_id)
        {
            Some(ino) => {
                info!("Removing file with ino={}, file_id={}", ino, file_id);

                self.acquire_file_ino_to_entry_map_lock().remove(ino);

                // TODO: Remove from file_id_to_ino_map

                return Some(*ino);
            }
            None => {
                return None;
            }
        };
    }

    /// Get a file entry by its inode number
    pub fn get(&self, ino: u64) -> Option<FileEntry> {
        self.acquire_file_ino_to_entry_map_lock().get(&ino).cloned()
    }

    /// List all children files in the catalog
    pub fn list_children(&self) -> Vec<(u64, FileEntry)> {
        self.acquire_file_ino_to_entry_map_lock()
            .iter()
            .filter(|(ino, _)| **ino != ROOT_INO)
            .map(|(ino, entry)| (*ino, entry.clone()))
            .collect()
    }
}
