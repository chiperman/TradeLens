import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import CalculatorPage from "./page";

describe("CalculatorPage UI", () => {
  it("应当正确渲染标题", () => {
    render(<CalculatorPage />);
    expect(screen.getByText("TradeLens")).toBeDefined();
  });

  it("当输入买入参数时，应当实时更新保本价", async () => {
    render(<CalculatorPage />);

    const buyPriceInput = screen.getByLabelText(/买入价/i);
    fireEvent.change(buyPriceInput, { target: { value: "50000" } });

    // 使用正则匹配，忽略逗号和空格
    // 50,050 / 0.999 ≈ 50,100.1001...
    await waitFor(() => {
      expect(screen.getByText(/50,100\.1/)).toBeDefined();
    });
  });

  it("应当正确渲染两个场景的标签页", () => {
    render(<CalculatorPage />);

    // 验证 Tab Trigger 是否都正确渲染
    expect(screen.getByRole("tab", { name: /Scenario A/i })).toBeDefined();
    expect(screen.getByRole("tab", { name: /Scenario B/i })).toBeDefined();
  });
});
