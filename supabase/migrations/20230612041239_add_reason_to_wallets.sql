ALTER TABLE public.wallets
ADD COLUMN IF NOT EXISTS reason text DEFAULT ''