export type NavigationItem = {
  key: "dashboard" | "stocks" | "crypto" | "dca" | "analytics" | "integrations" | "settings";
  label: string;
  href: string;
  defaultVisible: boolean;
};

export const navigationItems: NavigationItem[] = [
  { key: "dashboard", label: "总览", href: "/", defaultVisible: true },
  { key: "stocks", label: "股票", href: "/stocks", defaultVisible: true },
  { key: "crypto", label: "Crypto", href: "/crypto", defaultVisible: false },
  { key: "dca", label: "定投", href: "/dca", defaultVisible: true },
  { key: "analytics", label: "分析", href: "/analytics", defaultVisible: false },
  { key: "integrations", label: "集成", href: "/integrations", defaultVisible: true },
  { key: "settings", label: "设置", href: "/settings", defaultVisible: true },
];
