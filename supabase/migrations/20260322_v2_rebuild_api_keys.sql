-- 重建 api_keys 表以支持多交易所和 OAuth
-- 注意：此迁移会删除旧表数据

drop table if exists public.api_keys;

create table public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  exchange text not null check (exchange in ('longbridge', 'binance', 'bitget', 'okx')),
  auth_type text not null default 'api_key' check (auth_type in ('api_key', 'oauth')),

  -- API Key 模式 (Binance/Bitget/OKX)
  api_key_encrypted text,
  api_secret_encrypted text,
  passphrase_encrypted text,

  -- OAuth 模式 (Longbridge)
  oauth_access_token_encrypted text,
  oauth_refresh_token_encrypted text,
  oauth_expires_at timestamp with time zone,

  label text default 'Default',
  last_sync_at timestamp with time zone,
  created_at timestamp with time zone default now() not null,

  unique (user_id, exchange, label)
);

-- RLS
alter table public.api_keys enable row level security;

create policy "Users can only access their own api_keys."
  on public.api_keys for all
  using (auth.uid() = user_id);

-- 索引
create index idx_api_keys_user_exchange on public.api_keys(user_id, exchange);
