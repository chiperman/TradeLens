import { AppShell } from "@/components/layout/app-shell";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <AppShell>
      <section className="grid gap-6">
        <div>
          <p className="text-sm text-muted">TradeLens v2</p>
          <h1 className="mt-2 text-3xl font-semibold text-body">投资账户总览</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-strong">
            MVP 将优先接入长桥股票账户，并支持 BTC/ETH 定投记录与盈亏追踪。
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm text-muted">总资产</p>
            <p className="mt-3 font-number text-2xl font-semibold text-body">USD --</p>
          </Card>
          <Card>
            <p className="text-sm text-muted">未实现盈亏</p>
            <p className="mt-3 font-number text-2xl font-semibold text-trading-up">--</p>
          </Card>
          <Card>
            <p className="text-sm text-muted">定投当前盈亏</p>
            <p className="mt-3 font-number text-2xl font-semibold text-trading-down">--</p>
          </Card>
        </div>
      </section>
    </AppShell>
  );
}
