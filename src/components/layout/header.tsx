"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import LanguageSwitcher from "@/components/language-switcher";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-6 border-b border-border bg-background/80 backdrop-blur-sm">
      {/* Left: Page title / Breadcrumb area */}
      <div className="flex items-center gap-3">
        {/* Mobile logo - shown only on small screens where sidebar is hidden */}
        <div className="flex md:hidden items-center gap-2">
          <span className="text-base font-bold tracking-tight">TradeLens</span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
