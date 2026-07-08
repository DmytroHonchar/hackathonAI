/*
# Provider Ownership, Storage & Extended RLS

1. Schema — additive only
   - `providers.owner_id` (uuid, nullable FK → auth.users): null for seeded rows, set for user-created listings
   - `providers.services` (text[], default '{}')  : short service tags e.g. "boiler repair"
   - `providers.gallery`  (text[], default '{}')  : extra image URLs; photo_url stays as primary

2. Unique partial index
   - `providers_one_per_owner` on (owner_id) WHERE owner_id IS NOT NULL
     Enforces one listing per user at the database level.

3. RLS on providers — additive, public SELECT stays intact
   - INSERT: authenticated users may only insert a row whose owner_id equals their own uid.
   - UPDATE: authenticated users may only update rows they own (owner_id = auth.uid()).
     Seeded rows have owner_id = NULL and are therefore untouchable by any user.

4. RLS on bookings — additive, existing customer policies unchanged
   - provider_select_bookings: a provider may SELECT bookings whose provider_id belongs to
     a providers row they own.
   - provider_update_bookings: a provider may UPDATE those same bookings (e.g. change status).
   Note: multiple PERMISSIVE policies on the same operation combine with OR, so customer
   policies (user_id = auth.uid()) remain fully effective alongside these new provider ones.

5. Supabase Storage
   - Bucket `provider-photos` (public) — created idempotently.
   - Public READ for anon + authenticated.
   - Authenticated INSERT / UPDATE / DELETE scoped to the owner's own folder:
     the first path segment must equal auth.uid() (uploads stored as {uid}/{filename}).
*/

-- ── providers columns ─────────────────────────────────────────────────
ALTER TABLE providers ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
ALTER TABLE providers ADD COLUMN IF NOT EXISTS services text[] NOT NULL DEFAULT '{}';
ALTER TABLE providers ADD COLUMN IF NOT EXISTS gallery  text[] NOT NULL DEFAULT '{}';

-- ── one listing per user ───────────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS providers_one_per_owner
  ON providers (owner_id) WHERE owner_id IS NOT NULL;

-- ── providers RLS: INSERT & UPDATE ────────────────────────────────────
DROP POLICY IF EXISTS "insert_own_provider" ON providers;
CREATE POLICY "insert_own_provider" ON providers FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "update_own_provider" ON providers;
CREATE POLICY "update_own_provider" ON providers FOR UPDATE
  TO authenticated
  USING  (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- ── bookings RLS: provider policies (additive) ────────────────────────
DROP POLICY IF EXISTS "provider_select_bookings" ON bookings;
CREATE POLICY "provider_select_bookings" ON bookings FOR SELECT
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM providers WHERE owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "provider_update_bookings" ON bookings;
CREATE POLICY "provider_update_bookings" ON bookings FOR UPDATE
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM providers WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    provider_id IN (
      SELECT id FROM providers WHERE owner_id = auth.uid()
    )
  );

-- ── Storage bucket ────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
  VALUES ('provider-photos', 'provider-photos', true)
  ON CONFLICT (id) DO NOTHING;

-- ── Storage object policies ───────────────────────────────────────────
DROP POLICY IF EXISTS "public_read_provider_photos" ON storage.objects;
CREATE POLICY "public_read_provider_photos" ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'provider-photos');

DROP POLICY IF EXISTS "owner_insert_provider_photos" ON storage.objects;
CREATE POLICY "owner_insert_provider_photos" ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'provider-photos'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

DROP POLICY IF EXISTS "owner_update_provider_photos" ON storage.objects;
CREATE POLICY "owner_update_provider_photos" ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'provider-photos'
    AND split_part(name, '/', 1) = auth.uid()::text
  );

DROP POLICY IF EXISTS "owner_delete_provider_photos" ON storage.objects;
CREATE POLICY "owner_delete_provider_photos" ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'provider-photos'
    AND split_part(name, '/', 1) = auth.uid()::text
  );
