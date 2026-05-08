-- Restore conversation creation flow for authenticated users.
-- A previous policy required conversation participants to exist before insert,
-- which made creating new conversations impossible.

DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;

CREATE POLICY "Authenticated users can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (true);
