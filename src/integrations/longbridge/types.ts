export type NormalizedLongbridgeAccount = {
  netAssets: string;
  totalCash: string;
  buyPower: string;
  currency: string;
  raw: unknown;
};

export type NormalizedLongbridgePosition = {
  symbol: string;
  name: string;
  market: string;
  quantity: string;
  availableQuantity: string;
  costPrice: string;
  currency: string;
  raw: unknown;
};

export type NormalizedLongbridgeExecution = {
  externalId: string;
  orderId: string;
  symbol: string;
  quantity: string;
  price: string;
  executedAt: Date;
  raw: unknown;
};

export type LongbridgeSyncPayload = {
  accountBalances: NormalizedLongbridgeAccount[];
  positions: NormalizedLongbridgePosition[];
  executions: NormalizedLongbridgeExecution[];
};
