-- Trip participants (join requests)
CREATE TABLE public.trip_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (trip_id, user_id)
);

ALTER TABLE public.trip_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can request to join trips"
  ON public.trip_participants FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users see their requests or requests on their trips"
  ON public.trip_participants FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid())
  );

CREATE POLICY "Trip owners can update join requests"
  ON public.trip_participants FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.trips t WHERE t.id = trip_id AND t.user_id = auth.uid()));

CREATE POLICY "Users can cancel their own requests"
  ON public.trip_participants FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Private ID documents bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('id_documents', 'id_documents', false)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own ID"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'id_documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own ID"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'id_documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own ID"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'id_documents' AND auth.uid()::text = (storage.foldername(name))[1]);