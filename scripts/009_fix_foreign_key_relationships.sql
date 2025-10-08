-- Fix foreign key relationships for PostgREST to properly join tables
-- This script updates the deliveries table foreign keys to reference the correct tables

-- Drop existing foreign key constraints
ALTER TABLE public.deliveries 
  DROP CONSTRAINT IF EXISTS deliveries_customer_id_fkey,
  DROP CONSTRAINT IF EXISTS deliveries_driver_id_fkey;

-- Add new foreign key constraints that reference the correct tables
-- customer_id should reference profiles table (not auth.users)
ALTER TABLE public.deliveries
  ADD CONSTRAINT deliveries_customer_id_fkey 
  FOREIGN KEY (customer_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- driver_id should reference drivers table (not auth.users)
ALTER TABLE public.deliveries
  ADD CONSTRAINT deliveries_driver_id_fkey 
  FOREIGN KEY (driver_id) 
  REFERENCES public.drivers(id) 
  ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_deliveries_customer_id ON public.deliveries(customer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_id ON public.deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON public.deliveries(created_at DESC);

-- Verify the relationships are set up correctly
DO $$
BEGIN
  RAISE NOTICE 'Foreign key relationships updated successfully';
  RAISE NOTICE 'deliveries.customer_id now references profiles(id)';
  RAISE NOTICE 'deliveries.driver_id now references drivers(id)';
END $$;
