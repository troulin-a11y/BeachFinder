-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Beaches cache (from Overpass)
CREATE TABLE beaches_cache (
  id BIGSERIAL PRIMARY KEY,
  osm_id TEXT UNIQUE NOT NULL,
  name TEXT,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  city TEXT,
  tags_json JSONB DEFAULT '{}',
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_beaches_location ON beaches_cache USING GIST(location);
CREATE INDEX idx_beaches_osm_id ON beaches_cache(osm_id);

-- Weather cache
CREATE TABLE weather_cache (
  id BIGSERIAL PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  data_json JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_weather_coords ON weather_cache(lat, lng);
CREATE INDEX idx_weather_fetched ON weather_cache(fetched_at);

-- Sea surface temperature cache
CREATE TABLE sst_cache (
  id BIGSERIAL PRIMARY KEY,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  temperature DOUBLE PRECISION NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('noaa', 'copernicus')),
  station_name TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_sst_coords ON sst_cache(lat, lng);
CREATE INDEX idx_sst_fetched ON sst_cache(fetched_at);

-- Photos cache
CREATE TABLE photos_cache (
  id BIGSERIAL PRIMARY KEY,
  osm_id TEXT NOT NULL,
  url TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('wikimedia', 'flickr', 'unsplash', 'fallback')),
  attribution TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_photos_osm ON photos_cache(osm_id);

-- Water quality
CREATE TABLE water_quality (
  id BIGSERIAL PRIMARY KEY,
  osm_id TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  classification TEXT CHECK (classification IN ('excellent', 'good', 'sufficient', 'poor')),
  ecoli DOUBLE PRECISION,
  enterococci DOUBLE PRECISION,
  source TEXT NOT NULL CHECK (source IN ('eea', 'epa')),
  year INTEGER NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_wq_coords ON water_quality(lat, lng);

-- Blue flag beaches
CREATE TABLE blue_flags (
  id BIGSERIAL PRIMARY KEY,
  osm_id TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  name TEXT,
  country TEXT,
  year INTEGER NOT NULL,
  source TEXT NOT NULL
);

CREATE INDEX idx_bf_coords ON blue_flags(lat, lng);

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  premium_status BOOLEAN DEFAULT FALSE,
  language TEXT DEFAULT 'fr',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites
CREATE TABLE favorites (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  osm_id TEXT NOT NULL,
  beach_name TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, osm_id)
);

-- Ad views tracking
CREATE TABLE ad_views (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 1,
  UNIQUE(user_id, view_date)
);

-- Helper function: find nearest cached weather
CREATE OR REPLACE FUNCTION find_nearest_weather(p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION, p_max_age_minutes INTEGER DEFAULT 60)
RETURNS TABLE(data_json JSONB, fetched_at TIMESTAMPTZ, dist_km DOUBLE PRECISION) AS $$
BEGIN
  RETURN QUERY
  SELECT w.data_json, w.fetched_at,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(w.lng, w.lat), 4326)::geography,
      ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
    ) / 1000.0 AS dist_km
  FROM weather_cache w
  WHERE w.fetched_at > NOW() - (p_max_age_minutes || ' minutes')::interval
  ORDER BY ST_SetSRID(ST_MakePoint(w.lng, w.lat), 4326)::geography <-> ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Helper function: find nearest SST
CREATE OR REPLACE FUNCTION find_nearest_sst(p_lat DOUBLE PRECISION, p_lng DOUBLE PRECISION, p_max_age_hours INTEGER DEFAULT 6)
RETURNS TABLE(temperature DOUBLE PRECISION, source TEXT, station_name TEXT, fetched_at TIMESTAMPTZ) AS $$
BEGIN
  RETURN QUERY
  SELECT s.temperature, s.source, s.station_name, s.fetched_at
  FROM sst_cache s
  WHERE s.fetched_at > NOW() - (p_max_age_hours || ' hours')::interval
  ORDER BY ST_SetSRID(ST_MakePoint(s.lng, s.lat), 4326)::geography <-> ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE ad_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own ad views" ON ad_views
  FOR ALL USING (auth.uid() = user_id);
