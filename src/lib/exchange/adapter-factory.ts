import { getAdapter, initializeAdapters } from "./registry";
import type { ExchangeName, ExchangeAdapter } from "./types";

let initialized = false;

/**
 * 获取交易所适配器的工厂方法
 * 确保所有适配器已初始化并返回请求的实例
 */
export async function getExchangeAdapter(exchange: ExchangeName): Promise<ExchangeAdapter> {
  if (!initialized) {
    await initializeAdapters();
    initialized = true;
  }
  return getAdapter(exchange);
}
