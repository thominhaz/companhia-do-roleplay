-- Fix: Remove permissive INSERT policy on notifications table
-- Notifications should only be created via the create_notification SECURITY DEFINER function
-- which provides controlled access to notification creation

DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.notifications;