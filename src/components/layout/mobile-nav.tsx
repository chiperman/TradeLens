"use client";

import { usePathname } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Calculator,
  BookOpen,
  BarChart3,
} from "lucide-react";

const NAV_ITEMS = [
  { key: "dashboard", href: "/", icon: LayoutDashboard },
  { key: "portfolio", href: "/portfolio", icon: Briefcase },
  { key: "calculator", href: "/calculator", icon: Calculator },
  { key: "ledger", href: "/ledger", icon: BookOpen },
  { key: "analytics", href: "/analytics", icon: BarChart3 },
] as const;

export function MobileNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();

  const isActive = (href: string) => {
    const segments = pathname.split("/").filter(Boolean);
    const pathWithoutLocale = "/" + segments.slice(1).join("/");

    if (href === "/") {
      return pathWithoutLocale === "/" || pathWithoutLocale === "";
    }
    return pathWithoutLocale.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-md">
      <div className="flex items-center justify-around h-16 px-2">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-lg transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <Icon className={cn("w-5 h-5", active && "text-primary")} />
              <span className="text-[9px] font-semibold uppercase tracking-wider">
                {t(item.key)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
