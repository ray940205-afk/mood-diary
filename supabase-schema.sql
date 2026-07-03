-- 在 Supabase SQL Editor 中执行以下语句建表

-- 1. 访问用户表
CREATE TABLE visitors (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT UNIQUE NOT NULL,
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now()
);

-- 2. 记录表（匿名）
CREATE TABLE entries (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  type TEXT,
  role TEXT,
  mood TEXT,
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. 反馈表
CREATE TABLE feedback (
  id BIGSERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. 索引
CREATE INDEX idx_visitors_last_seen ON visitors(last_seen);
CREATE INDEX idx_entries_created_at ON entries(created_at);
CREATE INDEX idx_entries_mood ON entries(mood);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);
