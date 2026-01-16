fn main() {
    tonic_build::compile_protos("proto/riven/vfs/v1/riven_vfs.proto")
        .expect("Failed to compile proto files");
}
