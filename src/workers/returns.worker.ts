import { moneyWeightedReturn, timeWeightedReturn } from "../lib/returns";

self.onmessage = (e: MessageEvent) => {
  const { type, payload, id } = e.data;

  try {
    if (type === "CALCULATE_IRR") {
      // Rehydrate dates since postMessage serializes them to strings
      const cashFlows = payload.cashFlows.map((cf: { amount: number; date: string }) => ({
        amount: cf.amount,
        date: new Date(cf.date),
      }));
      const irr = moneyWeightedReturn(cashFlows);
      self.postMessage({ id, result: irr });
    } else if (type === "CALCULATE_TWR") {
      const twr = timeWeightedReturn(payload.periods);
      self.postMessage({ id, result: twr });
    } else {
      self.postMessage({ id, error: "Unknown calculation type" });
    }
  } catch (err) {
    self.postMessage({ id, error: err instanceof Error ? err.message : "Unknown error" });
  }
};
