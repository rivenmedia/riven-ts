mod filesystem;
mod grpc_client;

use clap::Parser;
use fuser::MountOption;
use grpc_client::VfsGrpcClient;
use log::{error, info};
use std::sync::{Arc, Mutex};
use tokio::runtime::Runtime;

use crate::filesystem::{catalog::Catalog, streaming_fs::StreamingFS};

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
    let grpc_client = Arc::new(Mutex::new(VfsGrpcClient::new(args.grpc_server.clone())));
    let catalog = Arc::new(Mutex::new(Catalog::new()));

    let mut options = vec![MountOption::RO, MountOption::FSName("vfs".to_string())];

    options.push(MountOption::AllowOther);
    options.push(MountOption::AutoUnmount);

    let fs = StreamingFS::new(catalog.clone(), grpc_client.clone(), rt);

    // Spawn task to watch catalog updates
    let grpc_server_url = args.grpc_server.clone();
    let fs_mountpoint = args.mountpoint.clone();

    let _vfs = tokio::spawn(async move {
        match fuser::mount2(fs, &fs_mountpoint, &options) {
            Ok(_) => info!("Filesystem unmounted"),
            Err(e) => error!("Mount error: {}", e),
        }
    });

    let _watcher = tokio::spawn(async move {
        let daemon_id = format!("daemon-{}", std::process::id());

        loop {
            // Create a new client for each connection attempt
            let mut grpc_client = VfsGrpcClient::new(grpc_server_url.clone());

            match grpc_client.watch_catalog(daemon_id.clone()).await {
                Ok((mut inbound, ack_tx)) => {
                    info!("Connected to catalog watch stream");

                    while let Some(response) = inbound.message().await.unwrap_or_else(|e| {
                        panic!("Failed to receive message from catalog watch stream: {}", e)
                    }) {
                        println!("Received response = {:?}", response);

                        match response.r#type {
                            1 => {
                                // ADD
                                for file in response.files {
                                    if let Ok(cat) = catalog.lock() {
                                        let ino = cat.add_file(
                                            file.id.clone(),
                                            file.name.clone(),
                                            file.url,
                                            file.size,
                                        );
                                        info!(
                                            "Added file to catalog: ino={:?}, name={:?}",
                                            ino, file.name
                                        );
                                    }
                                }
                            }
                            2 => {
                                // REMOVE
                                for file in response.files {
                                    if let Ok(cat) = catalog.lock() {
                                        cat.remove_file(file.id).unwrap_or_else(|| {
                                            panic!("Failed to remove file with id={}", file.id)
                                        });
                                        info!("Removed file from catalog: name={:?}", file.name);
                                    }
                                }
                            }
                            _ => {
                                info!("Unknown update type: {}", response.r#type);
                            }
                        }

                        ack_tx.send(response.update_id).unwrap_or_else(|e| {
                            panic!(
                                "Failed to send ack for update_id={}: {}",
                                response.update_id, e
                            )
                        });

                        println!("Sent ack for update_id={}", response.update_id);
                    }
                }
                Err(e) => {
                    error!("Failed to connect to catalog watch: {}", e);

                    tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;

                    continue;
                }
            }

            info!("Reconnecting to catalog watch in 5s...");
            // Ok(stream) => {
            //     info!("Connected to catalog watch stream");

            //     while let Some(update) = stream.next().await {
            //         if let Ok(cat_update) = update {
            //             info!(
            //                 "Received catalog update: {:?} for file {}",
            //                 cat_update.r#type,
            //                 cat_update
            //                     .file
            //                     .as_ref()
            //                     .map(|f| f.name.clone())
            //                     .unwrap_or_default()
            //             );

            //             if let Some(file) = cat_update.file {
            //                 if let Ok(cat) = catalog_watch.lock() {
            //                     match cat_update.r#type {
            //                         1 => {
            //                             // ADD
            //                             cat.add_file(file.name, file.url, file.size);
            //                             info!("Added file to catalog");
            //                         }
            //                         2 => {
            //                             // REMOVE
            //                             // TODO: implement remove
            //                             info!("Removed file from catalog");
            //                         }
            //                         3 => {
            //                             // UPDATE
            //                             // TODO: implement update
            //                             info!("Updated file in catalog");
            //                         }
            //                         _ => {
            //                             debug!("Unknown update type: {}", cat_update.r#type);
            //                         }
            //                     }
            //                 }
            //             }
            //         } else {
            //             error!("Catalog update stream error");
            //             break;
            //         }
            //     }

            //     info!("Catalog watch stream closed, reconnecting in 5s...");
            //     tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
            // }
            // Err(e) => {
            //     error!("Failed to connect to catalog watch: {}", e);
            //     tokio::time::sleep(tokio::time::Duration::from_secs(5)).await;
            // }
            // }
        }
    })
    .await;
}
