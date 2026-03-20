-- 1. 扩展 Profiles 表以支持 TradeLens 偏好设置
alter table public.profiles 
add column if not exists currency_preference text default 'CNY',
add column if not exists fee_maker numeric default 0.001,
add column if not exists fee_taker numeric default 0.001,
add column if not exists updated_at timestamp with time zone default timezone('utc'::text, now());

-- 2. 创建 API Key 存储表 (后续 Phase 3 需实现加密逻辑)
create table if not exists public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  exchange text not null check (exchange in ('binance')),
  api_key_encrypted text not null,
  api_secret_encrypted text not null,
  label text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, exchange, label)
);

-- 3. 创建交易流水表
create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  symbol text not null,
  side text not null check (side in ('BUY', 'SELL')),
  price numeric not null,
  quantity numeric not null,
  quote_quantity numeric not null,
  commission numeric default 0,
  commission_asset text,
  trade_id bigint,
  order_id bigint,
  transacted_at timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. 启用行级安全 (RLS)
alter table public.api_keys enable row level security;
alter table public.transactions enable row level security;

-- 5. 创建访问策略
do $$ 
begin
  if not exists (select 1 from pg_policies where tablename = 'api_keys' and policyname = 'Users can only see their own api_keys.') then
    create policy "Users can only see their own api_keys." on public.api_keys for all using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'transactions' and policyname = 'Users can only see their own transactions.') then
    create policy "Users can only see their own transactions." on public.transactions for all using (auth.uid() = user_id);
  end if;
end $$;
