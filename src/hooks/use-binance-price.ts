import { useState, useEffect, useRef } from "react";

/**
 * Binance 实时价格 Hook
 * @param symbol 交易对名称，例如 "BTCUSDT"
 * @returns { price: number | null, isConnected: boolean, error: string | null }
 */
export function useBinancePrice(symbol: string = "BTCUSDT") {
  const [price, setPrice] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const streamName = symbol.toLowerCase();
    const url = `wss://stream.binance.com:9443/ws/${streamName}@trade`;

    const connect = () => {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Binance @trade 流中的 'p' 代表成交价格
          if (data.p) {
            setPrice(parseFloat(data.p));
          }
        } catch {
          setError("解析行情数据失败");
        }
      };

      ws.current.onerror = () => {
        setError("WebSocket 连接错误");
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        // 3秒后尝试重连
        setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [symbol]);

  return { price, isConnected, error };
}
