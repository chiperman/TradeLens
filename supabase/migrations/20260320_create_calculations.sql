-- 创建计算历史表
create table if not exists public.calculations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  buy_price numeric not null,
  sell_price numeric,
  quantity numeric not null,
  profit numeric,
  fees numeric not null,
  type text not null check (type in ('break_even', 'profit')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 启用行级安全 (RLS)
alter table public.calculations enable row level security;

-- 允许用户只能查看和操作自己的数据
-- 此策略确保用户仅能看到与自己 user_id 匹配的记录
create policy "Users can only see their own calculations." on public.calculations
  for all using (auth.uid() = user_id);
