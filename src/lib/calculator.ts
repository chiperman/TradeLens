/**
 * 计算波段交易的核心公式
 * TradeLens - Calculator Logic v0.2 (Professional)
 */

interface TradeParams {
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  buyFeeRate: number;  // 例如 0.001 代表 0.1%
  sellFeeRate: number;
}

/**
 * 币本位回购计算 (Accumulation / High-Sell Low-Buy)
 * 逻辑：先卖开仓，再买回补，计算最终持币增量
 */
export function calculateAccumulation(params: TradeParams) {
  const { buyPrice, sellPrice, quantity, buyFeeRate, sellFeeRate } = params;

  // 1. 卖出阶段 (手续费扣除 USDT)
  const sellGross = sellPrice * quantity;
  const sellFeeUsdt = sellGross * sellFeeRate;
  const netSellUsdt = sellGross - sellFeeUsdt;

  // 2. 买入阶段 (手续费扣除 BTC)
  const buyGrossBtc = netSellUsdt / buyPrice;
  const buyFeeBtc = buyGrossBtc * buyFeeRate;
  const netBtcReceived = buyGrossBtc - buyFeeBtc;

  // 3. 结果汇总
  const btcGain = netBtcReceived - quantity;
  const totalFeesUsdt = sellFeeUsdt + (buyFeeBtc * buyPrice);

  return {
    netBtcReceived,
    btcGain,
    totalFeesUsdt,
    sellFeeUsdt,
    buyFeeBtc,
    netSellUsdt,
  };
}

/**
 * 法币本位保本价计算 (Fiat-based Break-even)
 * 目标：卖出后的净额等于买入时的总成本
 * 场景：已低价买入，求覆盖手续费的最小卖出价
 */
export function calculateBreakEven(buyPrice: number, quantity: number, buyFeeRate: number, sellFeeRate: number): number {
  // 买入总支出 = (价格 * 数量) / (1 - 买入手续费率) -> 如果买入是扣币，则支出就是 价格 * 数量
  // 注意：如果是买入扣币，买入时支付了买价 * 数量的 USDT，得到了 数量 * (1 - buyFeeRate) 的币
  
  const buyCostUsdt = buyPrice * quantity;
  const btcReceived = quantity * (1 - buyFeeRate);
  
  // 目标：(SellPrice * btcReceived * (1 - sellFeeRate)) = buyCostUsdt
  return buyCostUsdt / (btcReceived * (1 - sellFeeRate));
}

/**
 * 法币盈亏计算 (Buy Low -> Sell High)
 */
export function calculateNetProfit(
  buyPrice: number,
  sellPrice: number,
  quantity: number,
  buyFeeRate: number,
  sellFeeRate: number
): { profit: number; fees: number } {
  // 买入支出 (USDT)
  const buyTotal = buyPrice * quantity;
  // 实得币数 (BTC)
  const btcReceived = quantity * (1 - buyFeeRate);
  
  // 卖出总收入 (USDT)
  const sellTotal = sellPrice * btcReceived;
  // 卖出手续费 (USDT)
  const sellFee = sellTotal * sellFeeRate;
  
  const netProfit = sellTotal - sellFee - buyTotal;
  const totalFeesUsdt = (buyPrice * quantity * buyFeeRate) + sellFee; // 近似折算

  return { profit: netProfit, fees: totalFeesUsdt };
}
