/**
 * 交易所适配器注册表
 *
 * 按 exchange name 查找对应的适配器实例。
 * 适配器在首次使用时懒加载，避免不必要的依赖引入。
 */

import type { ExchangeAdapter, ExchangeName } from "./types";

const adapterMap = new Map<ExchangeName, ExchangeAdapter>();

/**
 * 注册一个交易所适配器
 */
export function registerAdapter(adapter: ExchangeAdapter): void {
  adapterMap.set(adapter.name, adapter);
}

/**
 * 获取指定交易所的适配器
 * @throws 如果适配器未注册
 */
export function getAdapter(exchange: ExchangeName): ExchangeAdapter {
  const adapter = adapterMap.get(exchange);
  if (!adapter) {
    throw new Error(`交易所适配器 "${exchange}" 尚未注册`);
  }
  return adapter;
}

/**
 * 获取所有已注册的适配器名称
 */
export function getRegisteredExchanges(): ExchangeName[] {
  return Array.from(adapterMap.keys());
}

export async function initializeAdapters(): Promise<void> {
  if (getRegisteredExchanges().length > 0) return;

  const { BinanceAdapter } = await import("./binance");
  const { BitgetAdapter } = await import("./bitget");
  const { OkxAdapter } = await import("./okx");
  const { LongbridgeAdapter } = await import("./longbridge");

  registerAdapter(new BinanceAdapter());
  registerAdapter(new BitgetAdapter());
  registerAdapter(new OkxAdapter());
  registerAdapter(new LongbridgeAdapter());
}
