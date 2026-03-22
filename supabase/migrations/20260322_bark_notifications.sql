create table if not exists public.notification_config (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  bark_server_url text default 'https://api.day.app' not null,
  bark_device_key text,
  is_enabled boolean default false not null,
  alert_threshold_percent numeric(5,2) default 5.00 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

alter table public.notification_config enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'notification_config' and policyname = 'Users can view their own notification config.') then
    create policy "Users can view their own notification config."
      on public.notification_config for select
      using ( auth.uid() = user_id );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'notification_config' and policyname = 'Users can update their own notification config.') then
    create policy "Users can update their own notification config."
      on public.notification_config for update
      using ( auth.uid() = user_id );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'notification_config' and policyname = 'Users can insert their own notification config.') then
    create policy "Users can insert their own notification config."
      on public.notification_config for insert
      with check ( auth.uid() = user_id );
  end if;
  
  if not exists (select 1 from pg_policies where tablename = 'notification_config' and policyname = 'Users can delete their own notification config.') then
    create policy "Users can delete their own notification config."
      on public.notification_config for delete
      using ( auth.uid() = user_id );
  end if;
end
$$;

-- Function to automatically update the updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_notification_config_updated_at on public.notification_config;
create trigger set_notification_config_updated_at
  before update on public.notification_config
  for each row
  execute procedure public.handle_updated_at();

-- Notification logs table for historical records
create table if not exists public.notification_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null,
  body text not null,
  status text not null, -- 'success', 'failed'
  error_message text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.notification_logs enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'notification_logs' and policyname = 'Users can view their own notification logs.') then
    create policy "Users can view their own notification logs."
      on public.notification_logs for select
      using ( auth.uid() = user_id );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'notification_logs' and policyname = 'Users can insert their own notification logs.') then
    create policy "Users can insert their own notification logs."
      on public.notification_logs for insert
      with check ( auth.uid() = user_id );
  end if;
end
$$;
