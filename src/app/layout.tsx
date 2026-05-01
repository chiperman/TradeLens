import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TradeLens",
  description: "个人投资账户与定投分析看板",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
