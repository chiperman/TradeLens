import Link from "next/link";
import { Button } from "@/components/ui/button";
import { navigationItems } from "@/config/navigation";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const visibleItems = navigationItems.filter((item) => item.defaultVisible);

  return (
    <main className="min-h-screen bg-canvas-dark text-body">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-hairline-on-dark bg-canvas-dark p-6 lg:block">
        <Link href="/" className="text-xl font-semibold text-primary">
          TradeLens
        </Link>
        <nav className="mt-8 grid gap-2">
          {visibleItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-muted-strong hover:bg-surface-card-dark hover:text-body"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <section className="lg:pl-64">
        <header className="flex h-16 items-center justify-between border-b border-hairline-on-dark px-6">
          <span className="text-sm text-muted">默认 USD · 可切换 CNY</span>
          <Button>同步长桥</Button>
        </header>
        <div className="p-6">{children}</div>
      </section>
    </main>
  );
}
