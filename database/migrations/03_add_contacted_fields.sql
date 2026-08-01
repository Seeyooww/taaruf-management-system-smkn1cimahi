-- SQL Migration: Add contacted tracking fields to booking table
-- Run this migration on your Supabase project SQL editor.

alter table public.booking
  add column if not exists akang_contacted boolean not null default false,
  add column if not exists akang_contacted_at text,
  add column if not exists teteh_contacted boolean not null default false,
  add column if not exists teteh_contacted_at text;
