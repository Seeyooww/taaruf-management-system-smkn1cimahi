import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export function Breadcrumb({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return <nav aria-label="breadcrumb" className={cn("flex items-center", className)} {...props} />;
}

export function BreadcrumbList({
  className,
  ...props
}: React.OlHTMLAttributes<HTMLOListElement>) {
  return (
    <ol className={cn("flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400", className)} {...props} />
  );
}

export function BreadcrumbItem({
  className,
  ...props
}: React.LiHTMLAttributes<HTMLLIElement>) {
  return <li className={cn("inline-flex items-center gap-2", className)} {...props} />;
}

export function BreadcrumbLink({
  className,
  href,
  ...props
}: React.ComponentProps<typeof Link>) {
  return (
    <Link
      href={href}
      className={cn("transition hover:text-zinc-950 dark:hover:text-white", className)}
      {...props}
    />
  );
}

export function BreadcrumbPage({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("font-medium text-zinc-950 dark:text-white", className)} {...props} />;
}

export function BreadcrumbSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span aria-hidden className={cn("text-zinc-400", className)} {...props}>
      <ChevronRight className="size-4" />
    </span>
  );
}
