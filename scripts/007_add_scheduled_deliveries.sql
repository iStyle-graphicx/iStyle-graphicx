-- Add scheduled delivery support
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS scheduled_pickup TIMESTAMP WITH TIME ZONE;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS paid_to_driver BOOLEAN DEFAULT FALSE;

-- Update status enum to include 'scheduled'
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_status_new') THEN
    CREATE TYPE delivery_status_new AS ENUM ('pending', 'scheduled', 'accepted', 'picked_up', 'in_transit', 'delivered', 'cancelled', 'rated');
    ALTER TABLE deliveries ALTER COLUMN status TYPE delivery_status_new USING status::text::delivery_status_new;
    DROP TYPE IF EXISTS delivery_status;
    ALTER TYPE delivery_status_new RENAME TO delivery_status;
  END IF;
END $$;

-- Create index for scheduled deliveries
CREATE INDEX IF NOT EXISTS idx_deliveries_scheduled ON deliveries(scheduled_pickup) WHERE scheduled_pickup IS NOT NULL;
