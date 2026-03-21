-- Phase 5: 期权模块支持
-- 创建期权持仓表与相关 RLS 策略

create table if not exists public.options_positions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  underlying_symbol text not null,
  option_type text not null check (option_type in ('CALL', 'PUT')),
  strike_price numeric not null,
  expiry_date date not null,
  premium numeric not null,
  contracts integer not null check (contracts > 0),
  multiplier integer not null default 100,
  status text not null default 'OPEN' check (status in ('OPEN', 'CLOSED', 'EXERCISED', 'EXPIRED')),
  close_premium numeric, -- 平仓时的期权金单价
  greeks jsonb, -- 扩展存储 Delta, Gamma 等
  notes text,
  opened_at timestamp with time zone default timezone('utc'::text, now()) not null,
  closed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 启用行级安全 (RLS)
alter table public.options_positions enable row level security;

-- 自动更新 updated_at 触发器函数 (如果尚未创建)
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- 绑定触发器
drop trigger if exists set_options_positions_updated_at on public.options_positions;
create trigger set_options_positions_updated_at
before update on public.options_positions
for each row
execute function public.handle_updated_at();

-- 创建访问策略
do $$ 
begin
  if not exists (select 1 from pg_policies where tablename = 'options_positions' and policyname = 'Users can only see their own options.') then
    create policy "Users can only see their own options." on public.options_positions for all using (auth.uid() = user_id);
  end if;
end $$;
