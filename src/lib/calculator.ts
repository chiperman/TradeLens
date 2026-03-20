/**
 * 计算波段交易的核心公式
 * TradeLens - Calculator Logic v0.1
 */

interface TradeParams {
  buyPrice: number;
  quantity: number;
  makerFeeRate: number; // 例如 0.001 代表 0.1%
  takerFeeRate: number;
}

/**
 * 计算保本价 (Break-even Price)
 * 公式: (买入成本 + 买入手续费) / (1 - 卖出手续费率) / 数量
 * 本质是让 (卖出总额 - 卖出手续费) = 买入总额 + 买入手续费
 */
export function calculateBreakEven(params: TradeParams): number {
  const { buyPrice, quantity, makerFeeRate, takerFeeRate } = params;
  const buyCost = buyPrice * quantity;
  const buyFee = buyCost * takerFeeRate; // 假设买入是用市价 (Taker)
  const totalCost = buyCost + buyFee;

  // (Price * Quantity * (1 - makerFeeRate)) = totalCost
  return totalCost / (quantity * (1 - makerFeeRate));
}

/**
 * 计算净利润
 */
export function calculateNetProfit(
  buyPrice: number,
  sellPrice: number,
  quantity: number,
  buyFeeRate: number,
  sellFeeRate: number
): { profit: number; fees: number } {
  const buyTotal = buyPrice * quantity;
  const buyFee = buyTotal * buyFeeRate;

  const sellTotal = sellPrice * quantity;
  const sellFee = sellTotal * sellFeeRate;

  const totalFees = buyFee + sellFee;
  const netProfit = sellTotal - buyTotal - totalFees;

  return { profit: netProfit, fees: totalFees };
}
