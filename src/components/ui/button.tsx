import { type ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(
        "inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-semibold text-on-primary transition-colors hover:bg-primary-active focus:outline-none focus:ring-2 focus:ring-info/50 disabled:bg-primary-disabled disabled:text-muted",
        className,
      )}
      {...props}
    />
  );
}
