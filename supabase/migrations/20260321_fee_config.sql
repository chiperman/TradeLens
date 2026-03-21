-- 添加 fee_config JSONB 字段以支持复杂的手续费模型
alter table public.profiles 
add column if not exists fee_config jsonb default '{
  "us_stock": { "type": "per_share", "rate": 0.005, "min": 1.0, "currency": "USD" },
  "hk_stock": { "type": "percentage", "rate": 0.0003, "min": 15.0, "currency": "HKD" },
  "crypto": { "type": "percentage", "rate": 0.001, "currency": "USDT" }
}'::jsonb;

-- 注释已有但过于简单的字段（保留兼容性，但后续建议弃用）
comment on column public.profiles.fee_maker is 'Legacy basic fee maker rate, replaced by fee_config';
comment on column public.profiles.fee_taker is 'Legacy basic fee taker rate, replaced by fee_config';
