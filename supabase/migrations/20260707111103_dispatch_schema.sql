/*
# Dispatch Schema — Initial Setup

1. New Extensions
   - `vector` (pgvector) for semantic search embeddings.

2. New Tables
   - `providers`: home-service providers (plumbers, electricians, cleaners) in Liverpool.
     Includes name, category, description, location (lat/lng), pricing, ratings, languages, 
     emergency flag, availability, and a 384-dim embedding vector.
   - `bookings`: user booking records linking a user to a provider with scheduling info 
     and status tracking.
   - `conversations`: chat message history per user for the AI concierge.

3. Security
   - RLS enabled on all tables.
   - `providers`: public SELECT (anon + authenticated). No client writes.
   - `bookings`: SELECT/INSERT/UPDATE scoped to the authenticated owner (`auth.uid() = user_id`).
     DELETE intentionally omitted — bookings should be cancelled, not deleted.
   - `conversations`: SELECT/INSERT scoped to the authenticated owner.

4. Postgres RPC Functions
   - `search_providers`: haversine-distance search with category/price/emergency filters,
     ordered by rating desc then distance asc. SECURITY DEFINER.
   - `match_providers`: vector similarity search blended with distance score,
     ordered by (similarity * 0.7) + (distance_score * 0.3) desc. SECURITY DEFINER.

5. Notes
   - `bookings.user_id` defaults to `auth.uid()` so inserts that omit it still satisfy RLS.
   - Embeddings are 384-dimensional (gte-small model).
   - `providers.embedding` is nullable; populated separately by the `embed-providers` function.
*/

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- ──────────────────────────────────────────────
-- providers
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('plumber','electrician','cleaner')),
  description text NOT NULL,
  photo_url text,
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  city text NOT NULL DEFAULT 'Liverpool',
  price_from numeric NOT NULL,
  languages text[] NOT NULL DEFAULT '{English}',
  rating numeric NOT NULL,
  review_count int NOT NULL,
  emergency boolean NOT NULL DEFAULT false,
  available boolean NOT NULL DEFAULT true,
  embedding vector(384),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_select_providers" ON providers;
CREATE POLICY "public_select_providers" ON providers FOR SELECT
  TO anon, authenticated USING (true);

-- ──────────────────────────────────────────────
-- bookings
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  provider_id uuid NOT NULL REFERENCES providers(id),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','on_the_way','in_progress','completed','cancelled')),
  scheduled_for timestamptz NOT NULL,
  address text NOT NULL,
  notes text,
  price numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_bookings" ON bookings;
CREATE POLICY "select_own_bookings" ON bookings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_bookings" ON bookings;
CREATE POLICY "insert_own_bookings" ON bookings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_bookings" ON bookings;
CREATE POLICY "update_own_bookings" ON bookings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- conversations
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_conversations" ON conversations;
CREATE POLICY "select_own_conversations" ON conversations FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_conversations" ON conversations;
CREATE POLICY "insert_own_conversations" ON conversations FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- ──────────────────────────────────────────────
-- RPC: search_providers
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION search_providers(
  filter_category text DEFAULT NULL,
  max_price numeric DEFAULT NULL,
  only_emergency boolean DEFAULT false,
  user_lat double precision DEFAULT 53.4084,
  user_lng double precision DEFAULT -2.9916,
  max_distance_km double precision DEFAULT 25
)
RETURNS TABLE (
  id uuid,
  name text,
  category text,
  description text,
  photo_url text,
  lat double precision,
  lng double precision,
  city text,
  price_from numeric,
  languages text[],
  rating numeric,
  review_count int,
  emergency boolean,
  available boolean,
  embedding vector(384),
  created_at timestamptz,
  distance_km double precision
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    p.*,
    (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(p.lat)) *
        cos(radians(p.lng) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(p.lat))
      )
    ) AS distance_km
  FROM providers p
  WHERE
    (filter_category IS NULL OR p.category = filter_category)
    AND (max_price IS NULL OR p.price_from <= max_price)
    AND (NOT only_emergency OR p.emergency = true)
    AND (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(p.lat)) *
        cos(radians(p.lng) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(p.lat))
      )
    ) <= max_distance_km
  ORDER BY p.rating DESC, distance_km ASC;
$$;

-- ──────────────────────────────────────────────
-- RPC: match_providers
-- ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION match_providers(
  query_embedding vector(384),
  match_count int DEFAULT 5,
  filter_category text DEFAULT NULL,
  user_lat double precision DEFAULT 53.4084,
  user_lng double precision DEFAULT -2.9916
)
RETURNS TABLE (
  id uuid,
  name text,
  category text,
  description text,
  photo_url text,
  lat double precision,
  lng double precision,
  city text,
  price_from numeric,
  languages text[],
  rating numeric,
  review_count int,
  emergency boolean,
  available boolean,
  similarity double precision,
  distance_km double precision,
  score double precision
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    p.id,
    p.name,
    p.category,
    p.description,
    p.photo_url,
    p.lat,
    p.lng,
    p.city,
    p.price_from,
    p.languages,
    p.rating,
    p.review_count,
    p.emergency,
    p.available,
    (1 - (p.embedding <=> query_embedding))::double precision AS similarity,
    (
      6371 * acos(
        cos(radians(user_lat)) * cos(radians(p.lat)) *
        cos(radians(p.lng) - radians(user_lng)) +
        sin(radians(user_lat)) * sin(radians(p.lat))
      )
    )::double precision AS distance_km,
    (
      (1 - (p.embedding <=> query_embedding)) * 0.7 +
      (1 - LEAST(
        6371 * acos(
          cos(radians(user_lat)) * cos(radians(p.lat)) *
          cos(radians(p.lng) - radians(user_lng)) +
          sin(radians(user_lat)) * sin(radians(p.lat))
        ),
        20.0
      ) / 20.0) * 0.3
    )::double precision AS score
  FROM providers p
  WHERE
    p.embedding IS NOT NULL
    AND (filter_category IS NULL OR p.category = filter_category)
  ORDER BY score DESC
  LIMIT match_count;
$$;
