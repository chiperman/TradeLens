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

  // 1. 卖出阶段 (手续费扣除 Quote)
  const sellGross = sellPrice * quantity;
  const sellFeeQuote = sellGross * sellFeeRate;
  const netSellQuote = sellGross - sellFeeQuote;

  // 2. 买入阶段 (手续费扣除 Base)
  const buyGrossBase = netSellQuote / buyPrice;
  const buyFeeBase = buyGrossBase * buyFeeRate;
  const netBaseReceived = buyGrossBase - buyFeeBase;

  // 3. 结果汇总
  const baseGain = netBaseReceived - quantity;
  const totalFeesQuote = sellFeeQuote + (buyFeeBase * buyPrice);

  return {
    netBaseReceived,
    baseGain,
    totalFeesQuote,
    sellFeeQuote,
    buyFeeBase,
    netSellQuote,
  };
}

/**
 * 法币本位保本价计算 (Fiat-based Break-even)
 * 目标：卖出后的净额等于买入时的总成本
 * 场景：已低价买入，求覆盖手续费的最小卖出价
 */
export function calculateBreakEven(buyPrice: number, quantity: number, buyFeeRate: number, sellFeeRate: number): number {
  const buyCostQuote = buyPrice * quantity;
  const baseReceived = quantity * (1 - buyFeeRate);
  
  // 目标：(SellPrice * baseReceived * (1 - sellFeeRate)) = buyCostQuote
  return buyCostQuote / (baseReceived * (1 - sellFeeRate));
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
  // 买入支出 (Quote)
  const buyTotal = buyPrice * quantity;
  // 实得币数 (Base)
  const baseReceived = quantity * (1 - buyFeeRate);
  
  // 卖出总收入 (Quote)
  const sellTotal = sellPrice * baseReceived;
  // 卖出手续费 (Quote)
  const sellFee = sellTotal * sellFeeRate;
  
  const netProfit = sellTotal - sellFee - buyTotal;
  const totalFeesQuote = (buyPrice * quantity * buyFeeRate) + sellFee; // 近似折算

  return { profit: netProfit, fees: totalFeesQuote };
}
