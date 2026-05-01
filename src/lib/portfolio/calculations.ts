export type DcaEntryInput = {
  type: "buy" | "sell";
  quantity: number;
  price: number;
  fee: number;
};

export type DcaSummaryInput = {
  currentPrice: number;
  entries: DcaEntryInput[];
};

export type DcaSummary = {
  totalQuantity: number;
  cumulativeInput: number;
  recoveredPrincipal: number;
  remainingCost: number;
  currentValue: number;
  currentPnl: number;
};

export function calculateDcaSummary(input: DcaSummaryInput): DcaSummary {
  const cumulativeInput = input.entries
    .filter((entry) => entry.type === "buy")
    .reduce((total, entry) => total + entry.quantity * entry.price + entry.fee, 0);

  const recoveredPrincipal = input.entries
    .filter((entry) => entry.type === "sell")
    .reduce((total, entry) => total + entry.quantity * entry.price - entry.fee, 0);

  const totalQuantity = input.entries.reduce((total, entry) => {
    return entry.type === "buy" ? total + entry.quantity : total - entry.quantity;
  }, 0);

  const remainingCost = cumulativeInput - recoveredPrincipal;
  const currentValue = totalQuantity * input.currentPrice;
  const currentPnl = currentValue + recoveredPrincipal - cumulativeInput;

  return {
    totalQuantity,
    cumulativeInput,
    recoveredPrincipal,
    remainingCost,
    currentValue,
    currentPnl,
  };
}
