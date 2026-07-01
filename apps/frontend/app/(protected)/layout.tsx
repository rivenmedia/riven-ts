export default function ProtectedLayout({ children }: LayoutProps<"/">) {
  return (
    <main
      // in:fly|global={{ y: 20, duration: 600, easing: cubicOut }}
      className="mt-4 flex flex-col gap-6 p-4 pb-24 md:mt-14 md:gap-8 md:p-8 md:px-16"
    >
      {children}
    </main>
  );
}
