import { PageShell } from "#components/page-shell/page-shell.tsx";

export default function ProfileLayout({
  children,
}: Pick<LayoutProps<"/profile">, "children">) {
  return <PageShell className="mx-auto w-full max-w-5xl">{children}</PageShell>;
}
