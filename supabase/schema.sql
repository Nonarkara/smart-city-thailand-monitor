-- Muang Thong Thani Dashboard — Supabase Schema
-- Migration-ready: run this in Supabase SQL Editor when ready to connect
-- Until then, the app uses in-memory state with JSON file persistence

-- Incidents / Maintenance Tracker
CREATE TABLE incidents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  title_th TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_th TEXT,
  description_en TEXT,
  category TEXT NOT NULL CHECK (category IN ('water','road','electrical','security','waste','noise','construction','other')),
  urgency TEXT NOT NULL CHECK (urgency IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','assigned','in-progress','resolved','closed')),
  lat DOUBLE PRECISION NOT NULL,
  lon DOUBLE PRECISION NOT NULL,
  zone_id TEXT,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_to TEXT,
  resolved_at TIMESTAMPTZ,
  photo_urls TEXT[] DEFAULT '{}',
  ai_summary_th TEXT,
  ai_summary_en TEXT,
  matched_camera_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Vision Detection Results
CREATE TABLE vision_detections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id TEXT NOT NULL,
  camera_id TEXT NOT NULL,
  model_id TEXT NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  detections JSONB NOT NULL DEFAULT '[]',
  processing_ms INTEGER,
  frame_url TEXT
);

-- Pageview Analytics
CREATE TABLE pageviews (
  id BIGSERIAL PRIMARY KEY,
  path TEXT NOT NULL,
  referrer TEXT,
  country TEXT,
  lang TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gate Flow History (for time-series analysis)
CREATE TABLE gate_flow_history (
  id BIGSERIAL PRIMARY KEY,
  gate_id TEXT NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_minutes INTEGER NOT NULL DEFAULT 60,
  count_in INTEGER NOT NULL DEFAULT 0,
  count_out INTEGER NOT NULL DEFAULT 0,
  by_class JSONB DEFAULT '{}',
  avg_speed_kmh REAL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AQI History (for 30-day trends)
CREATE TABLE aqi_history (
  id BIGSERIAL PRIMARY KEY,
  zone_id TEXT NOT NULL,
  measured_at TIMESTAMPTZ NOT NULL,
  aqi INTEGER NOT NULL,
  pm25 REAL,
  pm10 REAL,
  source TEXT DEFAULT 'open-meteo',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_zone ON incidents(zone_id);
CREATE INDEX idx_incidents_urgency ON incidents(urgency);
CREATE INDEX idx_incidents_reported ON incidents(reported_at DESC);
CREATE INDEX idx_vision_camera ON vision_detections(camera_id);
CREATE INDEX idx_vision_detected ON vision_detections(detected_at DESC);
CREATE INDEX idx_pageviews_path ON pageviews(path);
CREATE INDEX idx_pageviews_created ON pageviews(created_at DESC);
CREATE INDEX idx_gate_flow_gate ON gate_flow_history(gate_id, period_start DESC);
CREATE INDEX idx_aqi_zone ON aqi_history(zone_id, measured_at DESC);

-- Row Level Security (enable when ready)
-- ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE vision_detections ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pageviews ENABLE ROW LEVEL SECURITY;
