-- Create a table to store driver document URLs
CREATE TABLE IF NOT EXISTS driver_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  document_url TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES profiles(id),
  UNIQUE(driver_id, document_type)
);

-- Add RLS policies
ALTER TABLE driver_documents ENABLE ROW LEVEL SECURITY;

-- Drivers can insert and view their own documents
CREATE POLICY "Drivers can insert their own documents"
  ON driver_documents FOR INSERT
  WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can view their own documents"
  ON driver_documents FOR SELECT
  USING (auth.uid() = driver_id);

-- Admins can view and update all documents (you'll need to implement admin role checking)
CREATE POLICY "Admins can view all documents"
  ON driver_documents FOR SELECT
  USING (true);

CREATE POLICY "Admins can update all documents"
  ON driver_documents FOR UPDATE
  USING (true);
