export interface CodeBlockProps {
  /** Names the block for screen readers. Distinct on each page. */
  label: string;
  children: string;
}

/** Preformatted text that scrolls sideways and can be scrolled by keyboard. */
export function CodeBlock({ label, children }: CodeBlockProps) {
  return (
    <pre
      // A scrollable region must take focus so keyboard users can scroll it (WCAG 2.1.1).
      // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
      // A <pre> can't be a <section>.
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="region"
      aria-label={label}
      className="bg-background focus-visible:ring-ring/50 focus-visible:border-ring overflow-x-auto rounded-lg border p-3 font-mono text-xs leading-relaxed outline-none focus-visible:ring-[3px]"
    >
      {children}
    </pre>
  );
}
