export default function ExploreLayout({ children }: LayoutProps<"/explore">) {
  return (
    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9">
      {children}
    </div>
  );
}
