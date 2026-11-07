import { PageShell } from "#components/page-shell/page-shell.tsx";

export default function ProfileLayout({ children }: LayoutProps<"/profile">) {
  return <PageShell className="mx-auto w-full max-w-5xl">{children}</PageShell>;
}
