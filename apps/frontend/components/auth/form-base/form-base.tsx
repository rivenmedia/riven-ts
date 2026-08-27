import { cn } from "@/lib/utils";

import { kebabCase } from "es-toolkit";

import type { ReactNode } from "react";

export interface FormBaseProps extends Pick<
  React.HTMLAttributes<HTMLDivElement>,
  "className"
> {
  content: ReactNode;
  description: string;
  footer?: ReactNode;
  title: string;
}

export function FormBase({
  content,
  description,
  footer,
  className,
  title,
}: FormBaseProps) {
  return (
    <section
      className={cn("grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)]", className)}
    >
      <div>
        <h2
          className="text-base font-semibold"
          id={`${kebabCase(title)}-form-title`}
        >
          {title}
        </h2>
        {description && (
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        )}
      </div>
      <div className="min-w-0">
        {content}
        {footer && <div className="mt-4">{footer}</div>}
      </div>
    </section>
  );
}
