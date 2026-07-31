-- SQL Migration: Phase 1 Foundation User Profiles
-- Table: public.user_profiles

create table if not exists public.user_profiles (
    id uuid primary key default gen_random_uuid(),
    auth_user_id uuid not null unique,
    username text not null unique,
    role text not null check (role in ('admin', 'kelompok')),
    display_name text,
    must_change_password boolean not null default true,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Indices for performance
create index if not exists idx_user_profiles_role on public.user_profiles(role);
create index if not exists idx_user_profiles_active on public.user_profiles(is_active);
