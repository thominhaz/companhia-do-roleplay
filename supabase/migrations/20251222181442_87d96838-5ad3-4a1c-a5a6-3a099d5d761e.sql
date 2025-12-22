-- First migration: Add new subscription status values to the enum
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'aldeao';
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'heroi';
ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'mestre';