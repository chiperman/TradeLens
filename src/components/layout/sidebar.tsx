"use client";

import { useState } from "react";
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
  Settings,
  Layers,
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const NAV_ITEMS = [
  { key: "dashboard", href: "/", icon: LayoutDashboard },
  { key: "portfolio", href: "/portfolio", icon: Briefcase },
  { key: "calculator", href: "/calculator", icon: Calculator },
  { key: "ledger", href: "/ledger", icon: BookOpen },
  { key: "analytics", href: "/analytics", icon: BarChart3 },
  { key: "options", href: "/options", icon: Layers },
  { key: "settings", href: "/settings", icon: Settings },
] as const;

interface SidebarProps {
  onSignOut?: () => void;
  userEmail?: string;
}

export function Sidebar({ onSignOut, userEmail }: SidebarProps) {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("tradelens_sidebar_collapsed") === "true";
    }
    return false;
  });

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("tradelens_sidebar_collapsed", String(next));
  };

  const isActive = (href: string) => {
    // Strip locale prefix for matching, e.g. /zh/calculator -> /calculator
    const segments = pathname.split("/").filter(Boolean);
    const pathWithoutLocale = "/" + segments.slice(1).join("/");

    if (href === "/") {
      return pathWithoutLocale === "/" || pathWithoutLocale === "";
    }
    return pathWithoutLocale.startsWith(href);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen sticky top-0 border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out z-40",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center h-14 px-4 border-b border-sidebar-border",
            collapsed ? "justify-center" : "gap-3"
          )}
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
          {!collapsed && (
            <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
              TradeLens
            </span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;

            const linkContent = (
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    : "text-sidebar-foreground/70",
                  collapsed && "justify-center px-0"
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    active ? "text-primary" : "text-sidebar-foreground/50"
                  )}
                />
                {!collapsed && <span>{t(item.key)}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={item.key}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" sideOffset={8}>
                    {t(item.key)}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return <div key={item.key}>{linkContent}</div>;
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-sidebar-border p-3 space-y-2">
          {/* User info */}
          {userEmail && !collapsed && (
            <div className="px-3 py-1.5">
              <p className="text-[10px] font-medium text-sidebar-foreground/40 uppercase tracking-wider truncate">
                {userEmail}
              </p>
            </div>
          )}

          {/* Sign out */}
          {onSignOut && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onSignOut}
                  className={cn(
                    "flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                    "text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  {!collapsed && <span>{t("signOut")}</span>}
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" sideOffset={8}>
                  {t("signOut")}
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {/* Collapse toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className={cn(
              "w-full h-8 text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              collapsed && "px-0"
            )}
          >
            {collapsed ? (
              <ChevronsRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronsLeft className="w-4 h-4 mr-2" />
                <span className="text-xs">{t("collapse")}</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
