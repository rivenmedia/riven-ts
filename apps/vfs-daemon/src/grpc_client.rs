use std::thread::yield_now;

use futures::stream::StreamExt;
use log::{debug, error, info};
use riven_vfs::riven_vfs_service_client::RivenVfsServiceClient;
use riven_vfs::{StreamFileRequest, SyncFilesRequest};
use tonic::async_trait;
use tonic::transport::Channel;

/// gRPC client for streaming file data from backend
#[derive(Clone)]
pub struct VfsGrpcClient {
    server_addr: String,
    channel: Option<Channel>,
}

impl VfsGrpcClient {
    pub fn new(server_addr: String) -> Self {
        Self {
            server_addr,
            channel: None,
        }
    }

    pub async fn connect(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        debug!("Connecting to gRPC server at {}", self.server_addr);

        let channel = Channel::from_shared(self.server_addr.clone())?
            .connect()
            .await?;

        self.channel = Some(channel);

        debug!("Connected to gRPC server");

        Ok(())
    }

    pub async fn stream_file(
        &mut self,
        url: String,
        offset: u64,
        length: u64,
        chunk_size: u32,
    ) -> Result<Vec<u8>, Box<dyn std::error::Error>> {
        if self.channel.is_none() {
            self.connect().await?;
        }

        let channel = self.channel.as_ref().ok_or("No channel available")?.clone();

        let mut client = RivenVfsServiceClient::new(channel);

        let request = StreamFileRequest {
            url: url.clone(),
            offset,
            length,
            chunk_size,
            timeout_seconds: 30,
        };

        debug!(
            "Streaming: url={}, offset={}, length={}, chunk_size={}",
            url, offset, length, chunk_size
        );

        let response = client.stream_file(request).await?;
        let mut stream = response.into_inner();

        let mut data = Vec::new();
        let mut chunk_count = 0;

        while let Some(chunk) = stream.next().await {
            match chunk {
                Ok(file_chunk) => {
                    data.extend_from_slice(&file_chunk.data);

                    chunk_count += 1;

                    debug!(
                        "Chunk {}: {} bytes (total: {})",
                        file_chunk.chunk_number,
                        file_chunk.data.len(),
                        data.len()
                    );

                    if file_chunk.is_final {
                        debug!(
                            "Stream completed: {} chunks, {} bytes",
                            chunk_count,
                            data.len()
                        );

                        break;
                    }
                }
                Err(e) => {
                    error!("Stream error: {}", e);
                    return Err(Box::new(e));
                }
            }
        }

        Ok(data)
    }

    pub async fn sync_files(&mut self) -> Result<(), Box<dyn std::error::Error>> {
        if self.channel.is_none() {
            self.connect().await?;
        }

        let channel = self.channel.as_ref().ok_or("No channel available")?.clone();

        let mut client = RivenVfsServiceClient::new(channel);

        let request = SyncFilesRequest {};

        let response = client.sync_files(request).await?;
        let mut stream = response.into_inner();
        let mut has_error = false;

        while !has_error {
            while let Some(sync_response) = stream.next().await {
                info!(
                    "Processing sync response... {:#?}",
                    sync_response.clone().unwrap().files
                );
                match sync_response {
                    Ok(resp) => {
                        info!("Received sync response with {} files", resp.files.len());
                        yield resp.files
                    }
                    Err(e) => {
                        error!("Sync error: {}", e);
                        has_error = true;
                        // return Err(Box::new(e));
                    }
                }
            }
        }

        Ok(())
    }
}
