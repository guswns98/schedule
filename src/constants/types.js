import { CheckSquare, Bug, FlaskConical, Flag } from "lucide-react";

export const TYPES = {
  task:      { label: "태스크",     prefix: "TASK", color: "#3B82F6", Icon: CheckSquare },
  bug:       { label: "버그",       prefix: "BUG",  color: "#F43F5E", Icon: Bug },
  test:      { label: "테스트",     prefix: "TEST", color: "#06B6D4", Icon: FlaskConical },
  milestone: { label: "마일스톤",   prefix: "MILE", color: "#D97706", Icon: Flag },
};

export const STATUSES = {
  todo:        { label: "대기",   color: "#94A3B8" },
  in_progress: { label: "진행중", color: "#F59E0B" },
  review:      { label: "검토",   color: "#8B5CF6" },
  done:        { label: "완료",   color: "#10B981" },
};

export const STATUS_ORDER = ["todo", "in_progress", "review", "done"];

export const PRIORITIES = {
  critical: { label: "긴급", color: "#DC2626", rank: 0 },
  high:     { label: "높음", color: "#EA580C", rank: 1 },
  medium:   { label: "보통", color: "#2563EB", rank: 2 },
  low:      { label: "낮음", color: "#64748B", rank: 3 },
};

export const STORAGE_KEY = "board-data";
