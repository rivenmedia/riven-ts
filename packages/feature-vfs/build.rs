fn main() {
    tonic_build::compile_protos("proto/riven/vfs/v1/riven_vfs.proto")
        .unwrap_or_else(|e| panic!("Failed to compile protos {:?}", e));
}
