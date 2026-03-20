import { renderHook, act } from "@testing-library/react";
import { useExchangeRate } from "./use-exchange-rate";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useExchangeRate", () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    store = {};
    
    vi.mocked(window.localStorage.getItem).mockImplementation((key) => store[key] || null);
    vi.mocked(window.localStorage.setItem).mockImplementation((key, value) => { store[key] = value.toString(); });
    vi.mocked(window.localStorage.clear).mockImplementation(() => { store = {}; });
  });

  it("should fetch exchange rate on mount if no cache", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        rates: { CNY: 7.2 },
        time_last_update_unix: Date.now() / 1000,
      }),
    });

    const { result } = renderHook(() => useExchangeRate());

    expect(result.current.isLoading).toBe(true);

    // Wait for the async effect
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.rate).toBe(7.2);
    expect(result.current.isLoading).toBe(false);
    expect(localStorage.getItem("tradelens_cny_rate")).toBe("7.2");
  });

  it("should use cached rate if it is fresh (< 1 hour)", async () => {
    const freshTime = Date.now() - 30 * 60 * 1000; // 30 mins ago
    localStorage.setItem("tradelens_cny_rate", "7.1");
    localStorage.setItem("tradelens_rate_updated", freshTime.toString());

    const { result } = renderHook(() => useExchangeRate());

    // Should be immediate (or almost immediate)
    expect(result.current.rate).toBe(7.1);
    expect(result.current.isLoading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should refresh rate when refresh() is called", async () => {
    localStorage.setItem("tradelens_cny_rate", "7.1");
    localStorage.setItem("tradelens_rate_updated", Date.now().toString());

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        rates: { CNY: 7.3 },
        time_last_update_unix: Date.now() / 1000,
      }),
    });

    const { result } = renderHook(() => useExchangeRate());

    // Initially uses cache
    expect(result.current.rate).toBe(7.1);

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.rate).toBe(7.3);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem("tradelens_cny_rate")).toBe("7.3");
  });

  it("should handle fetch error and fallback to cache", async () => {
    localStorage.setItem("tradelens_cny_rate", "7.1");
    localStorage.setItem("tradelens_rate_updated", "0"); // Expired

    mockFetch.mockRejectedValueOnce(new Error("Network Error"));

    const { result } = renderHook(() => useExchangeRate());

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.error).toBe("Network Error");
    expect(result.current.rate).toBe(7.1); // Fallback to old cache
  });
});
