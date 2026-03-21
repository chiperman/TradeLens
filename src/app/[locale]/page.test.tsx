import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CalculatorPage from "./page";

// Mock Hooks
vi.mock("@/hooks/use-binance-price", () => ({
  useBinancePrice: vi.fn(() => ({ price: 60000, isConnected: true, error: null }))
}));

vi.mock("@/hooks/use-exchange-rate", () => ({
  useExchangeRate: vi.fn(() => ({ rate: 7.2, isLoading: false }))
}));

vi.mock("@/hooks/use-trade-history", () => ({
  useTradeHistory: vi.fn(() => ({
    history: [],
    saveCalculation: vi.fn(),
    deleteCalculation: vi.fn(),
    exportToExcel: vi.fn(),
    exportToJSON: vi.fn()
  }))
}));

vi.mock("@/hooks/use-assets", () => ({
  useAssets: vi.fn(() => ({ assets: [], loading: false, refresh: vi.fn() }))
}));

describe("CalculatorPage UI", () => {
  it("应当正确渲染标题", () => {
    render(<CalculatorPage />);
    expect(screen.getByText("TradeLens")).toBeDefined();
  });

  it("当输入卖出参数时，应当实时更新保本回购价", async () => {
    render(<CalculatorPage />);

    const sellPriceInput = screen.getByLabelText(/Calculator\.sellPrice/i);
    fireEvent.change(sellPriceInput, { target: { value: "50000" } });

    // 逻辑：卖出所得 50000 * 0.999 = 49950
    // 保本回购价 = 49950 * 0.999 / 1 = 49900.05
    await waitFor(() => {
      expect(screen.getByText(/49,900\.05/)).toBeDefined();
    });
  });

  it("应当正确渲染两个场景的卡片", () => {
    render(<CalculatorPage />);
    
    // 验证场景卡片标题是否正确渲染
    expect(screen.getByText(/Calculator\.labelA/i)).toBeDefined();
    expect(screen.getByText(/Calculator\.labelB/i)).toBeDefined();
  });

  it("应当正确渲染底部的功能标签页", () => {
    render(<CalculatorPage />);

    // 验证底部 Tabs Trigger 是否正确渲染
    expect(screen.getByRole("tab", { name: /History\.title/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Assets\.title/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Calculator\.smartAnalytics/i })).toBeDefined();
  });
});
