-- ============================================
-- QA/PM Board - Supabase 테이블 생성 스크립트
-- Supabase SQL Editor에서 실행하세요
-- ============================================

-- 메인 아이템 (task, bug, test, milestone)
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo',
  priority TEXT NOT NULL DEFAULT 'medium',
  assignee TEXT DEFAULT '',
  start_date TEXT,
  due_date TEXT,
  tags JSONB DEFAULT '[]',
  description TEXT DEFAULT '',
  module TEXT DEFAULT '',
  sprint TEXT DEFAULT '',
  release_id TEXT,
  created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM now()) * 1000)::BIGINT
);

-- 테스트 케이스
CREATE TABLE test_cases (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'
);

-- 테스트 실행 기록
CREATE TABLE test_runs (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'
);

-- 회귀 테스트 세트
CREATE TABLE regression_sets (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'
);

-- 버그 재현 데이터
CREATE TABLE bug_repro (
  item_id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'
);

-- 릴리스
CREATE TABLE releases (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'
);

-- 체크리스트 템플릿
CREATE TABLE checklist_templates (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'
);

-- 일일 리포트
CREATE TABLE daily_reports (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}'
);

-- 설정 (seq, members, featureAreas, environments)
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- 초기 설정 데이터
INSERT INTO config (key, value) VALUES
  ('seq', '{"task": 0, "bug": 0, "test": 0, "milestone": 0}'),
  ('members', '["지민", "현우", "서연"]'),
  ('featureAreas', '["인증", "결제", "장바구니", "마이페이지", "검색"]'),
  ('environments', '[{"id":"env-1","os":"iOS 17","browser":"Safari","device":"iPhone 15"},{"id":"env-2","os":"Android 14","browser":"Chrome","device":"Galaxy S24"},{"id":"env-3","os":"Windows 11","browser":"Chrome","device":"Desktop"},{"id":"env-4","os":"macOS 15","browser":"Safari","device":"Desktop"}]');

-- ============================================
-- RLS 정책 (anon 키로 전체 허용)
-- ============================================
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE regression_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE bug_repro ENABLE ROW LEVEL SECURITY;
ALTER TABLE releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all" ON items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON test_cases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON test_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON regression_sets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON bug_repro FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON releases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON checklist_templates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON daily_reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON config FOR ALL USING (true) WITH CHECK (true);
