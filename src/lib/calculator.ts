import { type FeeModel, type AssetClass } from "@/types/transaction";

export function calculateFeeAmount(
  grossAmount: number,
  quantity: number,
  feeModel: FeeModel
): number {
  let fee = 0;
  if (feeModel.type === "percentage") {
    fee = grossAmount * feeModel.rate;
  } else if (feeModel.type === "per_share") {
    fee = quantity * feeModel.rate;
  } else if (feeModel.type === "fixed") {
    fee = feeModel.rate;
  }

  if (feeModel.min !== undefined && fee < feeModel.min) {
    fee = feeModel.min;
  }

  return fee;
}

interface TradeParams {
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  buyFeeModel: FeeModel;
  sellFeeModel: FeeModel;
  assetClass: AssetClass;
}

export function calculateAccumulation(params: TradeParams) {
  const { buyPrice, sellPrice, quantity, buyFeeModel, sellFeeModel, assetClass } = params;

  // 1. Sell Stage (Fee always deducted in Quote)
  const sellGross = sellPrice * quantity;
  const sellFeeQuote = calculateFeeAmount(sellGross, quantity, sellFeeModel);
  const netSellQuote = sellGross - sellFeeQuote;

  // 2. Buy Stage (Using all netSellQuote to buy back)
  let buyGrossBase = 0;
  let buyFeeBase = 0;
  let netBaseReceived = 0;
  let buyFeeQuote = 0;

  if (assetClass === "crypto") {
    // Crypto: Buy fee is deducted from the Base asset received
    buyGrossBase = netSellQuote / buyPrice;
    buyFeeBase = calculateFeeAmount(buyGrossBase, buyGrossBase, buyFeeModel);
    netBaseReceived = buyGrossBase - buyFeeBase;
  } else {
    // Stocks: Buy fee is deducted from Quote asset, meaning we can afford fewer Base shares
    // BuyCost = (Qty * BuyPrice) + Fee(Quote)
    // We want BuyCost <= netSellQuote
    // For simplicity: guess Qty = netSellQuote / BuyPrice, then reduce Qty to cover fee in Quote
    let estimatedQty = netSellQuote / buyPrice;
    let estimatedFee = calculateFeeAmount(netSellQuote, estimatedQty, buyFeeModel);

    // Iterate 1-2 times for precision if percentage, but closed form is better:
    if (buyFeeModel.type === "percentage") {
      estimatedQty = netSellQuote / (buyPrice * (1 + buyFeeModel.rate));
      estimatedFee = estimatedQty * buyPrice * buyFeeModel.rate;
    } else if (buyFeeModel.type === "per_share") {
      estimatedQty = netSellQuote / (buyPrice + buyFeeModel.rate);
      estimatedFee = estimatedQty * buyFeeModel.rate;
    } else if (buyFeeModel.type === "fixed") {
      estimatedFee = buyFeeModel.rate;
      estimatedQty = (netSellQuote - estimatedFee) / buyPrice;
    }

    // Apply minimum fee corrections if necessary (simplified approximation)
    if (buyFeeModel.min && estimatedFee < buyFeeModel.min) {
      estimatedFee = buyFeeModel.min;
      estimatedQty = (netSellQuote - estimatedFee) / buyPrice;
    }

    buyFeeQuote = estimatedFee;
    netBaseReceived = estimatedQty;
    buyGrossBase = estimatedQty;
  }

  const baseGain = netBaseReceived - quantity;
  const totalFeesQuote =
    sellFeeQuote + (assetClass === "crypto" ? buyFeeBase * buyPrice : buyFeeQuote);

  return {
    netBaseReceived,
    baseGain,
    totalFeesQuote,
    sellFeeQuote,
    buyFeeBase,
    buyFeeQuote,
    netSellQuote,
  };
}

export function calculateBreakEven(
  buyPrice: number,
  quantity: number,
  buyFeeModel: FeeModel,
  sellFeeModel: FeeModel,
  assetClass: AssetClass
): number {
  let buyCostQuote = buyPrice * quantity;

  if (assetClass === "crypto") {
    // Crypto Buy: fee taken from Base. We get less base, so to break even we must sell that smaller base.
    const buyFeeBase = calculateFeeAmount(quantity, quantity, buyFeeModel);
    const baseReceived = quantity - buyFeeBase;

    // We want SellNet = buyCostQuote
    // SellNet = (SellPrice * baseReceived) - SellFeeQuote
    // Since SellFee could be percentage: SellPrice * baseReceived * (1 - rate) = buyCostQuote
    if (sellFeeModel.type === "percentage") {
      const rate = sellFeeModel.rate;
      // Assume no min fee bound hit for simplicity during BE calculation
      return buyCostQuote / (baseReceived * (1 - rate));
    } else if (sellFeeModel.type === "per_share") {
      return (buyCostQuote + baseReceived * sellFeeModel.rate) / baseReceived;
    } else {
      return (buyCostQuote + sellFeeModel.rate) / baseReceived;
    }
  } else {
    // Stocks: fee adds to quote. We get exactly `quantity` base.
    const buyFeeQuote = calculateFeeAmount(buyCostQuote, quantity, buyFeeModel);
    buyCostQuote += buyFeeQuote;

    // We want SellNet = buyCostQuote.
    // SellNet = (SellPrice * quantity) - SellFeeQuote
    if (sellFeeModel.type === "percentage") {
      return buyCostQuote / (quantity * (1 - sellFeeModel.rate));
    } else if (sellFeeModel.type === "per_share") {
      return (buyCostQuote + quantity * sellFeeModel.rate) / quantity;
    } else {
      return (buyCostQuote + sellFeeModel.rate) / quantity;
    }
  }
}

export function calculateNetProfit(
  buyPrice: number,
  sellPrice: number,
  quantity: number,
  buyFeeModel: FeeModel,
  sellFeeModel: FeeModel,
  assetClass: AssetClass
): { profit: number; fees: number } {
  const buyGross = buyPrice * quantity;
  let buyFeeQuote = 0;
  let baseReceived = quantity;

  if (assetClass === "crypto") {
    const buyFeeBase = calculateFeeAmount(quantity, quantity, buyFeeModel);
    baseReceived = quantity - buyFeeBase;
    buyFeeQuote = buyFeeBase * buyPrice; // proxy quotes
  } else {
    buyFeeQuote = calculateFeeAmount(buyGross, quantity, buyFeeModel);
  }

  const buyTotal = assetClass === "crypto" ? buyGross : buyGross + buyFeeQuote;

  const sellGross = sellPrice * baseReceived;
  const sellFeeQuote = calculateFeeAmount(sellGross, baseReceived, sellFeeModel);
  const sellTotal = sellGross - sellFeeQuote;

  const netProfit = sellTotal - buyTotal;
  const totalFeesQuote = buyFeeQuote + sellFeeQuote;

  return { profit: netProfit, fees: totalFeesQuote };
}
