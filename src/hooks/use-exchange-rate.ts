import { useState, useEffect } from "react";

interface ExchangeRateData {
  rates: {
    [key: string]: number;
  };
  time_last_update_unix: number;
}

/**
 * 获取法币汇率 Hook (USD to CNY)
 * @returns { rate: number | null, isLoading: boolean, error: string | null }
 */
export function useExchangeRate() {
  const [rate, setRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRate = async (force: boolean = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // 逻辑：如果非强制刷新，且缓存存在且不到 1 小时，则直接使用缓存
      const lastUpdated = localStorage.getItem("tradelens_rate_updated");
      const cachedRate = localStorage.getItem("tradelens_cny_rate");
      const ONE_HOUR = 3600000;

      if (!force && cachedRate && lastUpdated && Date.now() - parseInt(lastUpdated) < ONE_HOUR) {
        setRate(parseFloat(cachedRate));
        setIsLoading(false);
        return;
      }

      // 使用 open.er-api.com 获取免费实时汇率 (USD 基础)
      const response = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!response.ok) throw new Error("获取汇率失败，请检查网络连接");
      
      const data: ExchangeRateData = await response.json();
      const cnyRate = data.rates["CNY"];
      
      if (cnyRate) {
        setRate(cnyRate);
        localStorage.setItem("tradelens_cny_rate", cnyRate.toString());
        localStorage.setItem("tradelens_rate_updated", Date.now().toString());
      } else {
        throw new Error("返回数据中未找到 CNY 汇率");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "未知错误";
      setError(message);
      
      // 如果失败，尝试从缓存读取（即使过期）
      const cachedRate = localStorage.getItem("tradelens_cny_rate");
      if (cachedRate) {
        setRate(parseFloat(cachedRate));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRate();
  }, []);

  const refresh = () => fetchRate(true);

  return { rate, isLoading, error, refresh };
}
