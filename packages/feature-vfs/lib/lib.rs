// Re-export generated gRPC code
pub mod riven {
    pub mod vfs {
        tonic::include_proto!("riven.vfs.v1");
    }
}

pub use riven::vfs::*;
