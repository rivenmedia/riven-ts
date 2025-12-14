import { logger } from "@repo/core-util-logger";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  logger.info("Rendering RootLayout");

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
