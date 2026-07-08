DROP FUNCTION IF EXISTS search_providers(text, numeric, boolean, double precision, double precision, double precision);

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
  distance_km double precision
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
