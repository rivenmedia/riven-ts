use futures::stream::StreamExt;
use log::{debug, error, info};
use riven_vfs::riven_vfs_service_client::RivenVfsServiceClient;
use riven_vfs::{AckCommand, StreamFileRequest, SubscribeCommand, WatchCatalogRequest};
use tokio::sync::mpsc;
use tonic::transport::Channel;
use tonic::{IntoStreamingRequest, Request};

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

    pub async fn connect(&mut self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
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
    ) -> Result<Vec<u8>, Box<dyn std::error::Error + Send + Sync>> {
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

    /// Watch catalog for updates from server
    /// Returns a tuple of (inbound stream receiver, outbound ack sender)
    /// Use tx.send() to acknowledge updates after processing them
    pub async fn watch_catalog(
        &mut self,
        daemon_id: String,
    ) -> Result<
        (
            tonic::Streaming<riven_vfs::WatchCatalogResponse>,
            mpsc::UnboundedSender<u64>,
        ),
        Box<dyn std::error::Error + Send + Sync>,
    > {
        if self.channel.is_none() {
            self.connect()
                .await
                .map_err(|e| format!("Connect error: {}", e))?;
        }

        info!("Starting catalog watch for daemon_id={}", daemon_id);

        let channel = self
            .channel
            .as_ref()
            .ok_or("No channel available".to_string())?
            .clone();

        let mut client = RivenVfsServiceClient::new(channel);

        // Create channel for sending acknowledgments
        let (tx, mut rx) = mpsc::unbounded_channel();

        let subscribe_daemon_id = daemon_id.clone();
        let outbound = async_stream::stream! {
            info!("Sending catalog subscribe request for daemon_id={}", subscribe_daemon_id);

            yield WatchCatalogRequest {
                command: Some(riven_vfs::watch_catalog_request::Command::Subscribe(
                    SubscribeCommand {
                        daemon_id: subscribe_daemon_id,
                        version: 0, // Request all files
                    },
                )),
            };

            // Forward ack commands from the channel
            while let Some(update_id) = rx.recv().await {
                info!("Sending ack for update_id={}", update_id);
                yield WatchCatalogRequest {
                    command: Some(riven_vfs::watch_catalog_request::Command::Ack(
                        AckCommand {
                            update_id,
                        },
                    )),
                };
            }
        };

        let request = Request::new(outbound).into_streaming_request();

        let response = client.watch_catalog(request).await?;
        let inbound = response.into_inner();

        Ok((inbound, tx))
    }
}
