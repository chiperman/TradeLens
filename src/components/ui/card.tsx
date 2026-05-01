import { type HTMLAttributes } from "react";
import { clsx } from "clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={clsx(
        "rounded-xl border border-hairline-on-dark bg-surface-card-dark p-6 text-body",
        className,
      )}
      {...props}
    />
  );
}
