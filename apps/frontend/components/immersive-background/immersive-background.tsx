export function ImmersiveBackground() {
  // triggeer ci
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-0 bg-linear-to-b from-zinc-900 via-zinc-950 to-black" />
      <div className="bg-primary/5 absolute top-[-20%] left-[-10%] h-150 w-150 rounded-full blur-[120px]" />
      <div className="absolute right-[-5%] bottom-[-10%] h-125 w-125 rounded-full bg-blue-500/5 blur-[100px]" />
    </div>
  );
}
