import { TYPES } from "../constants/types";
import { toISO, addDays, pad } from "../utils/date";

export function seedData() {
  const base = new Date();
  const d = (n) => toISO(addDays(base, n));
  const mk = (o, i) => ({
    id: `seed-${i}`,
    code: `${TYPES[o.type].prefix}-${pad(o.n)}`,
    tags: [],
    description: "",
    module: "",
    sprint: "",
    releaseId: null,
    createdAt: Date.now() - i * 1000,
    ...o,
  });
  const items = [
    { type: "milestone", n: 1, title: "v2.4 릴리스", status: "in_progress", priority: "high",     assignee: "지민",  startDate: d(-2), dueDate: d(12), tags: ["release"] },
    { type: "task",      n: 1, title: "로그인 리팩터링", status: "in_progress", priority: "medium", assignee: "현우",  startDate: d(-3), dueDate: d(2) },
    { type: "task",      n: 2, title: "결제 API 연동",   status: "todo",       priority: "high",    assignee: "지민",  startDate: d(1),  dueDate: d(8) },
    { type: "test",      n: 1, title: "회원가입 회귀 테스트", status: "review", priority: "medium", assignee: "서연",  startDate: d(-1), dueDate: d(1) },
    { type: "test",      n: 2, title: "결제 시나리오 검증",   status: "todo",   priority: "high",   assignee: "서연",  startDate: d(6),  dueDate: d(10) },
    { type: "bug",       n: 1, title: "장바구니 수량 오류",   status: "in_progress", priority: "critical", assignee: "현우", startDate: d(0), dueDate: d(1) },
    { type: "bug",       n: 2, title: "iOS 스크롤 튐 현상",   status: "done",   priority: "low",    assignee: "서연",  startDate: d(-4), dueDate: d(-2) },
  ].map(mk);

  return {
    version: 2,
    items,
    seq: { task: 2, bug: 2, test: 2, milestone: 1 },
    testCases: [],
    testRuns: [],
    regressionSets: [],
    featureAreas: ["인증", "결제", "장바구니", "마이페이지", "검색"],
    bugReproData: {},
    environments: [
      { id: "env-1", os: "iOS 17", browser: "Safari", device: "iPhone 15" },
      { id: "env-2", os: "Android 14", browser: "Chrome", device: "Galaxy S24" },
      { id: "env-3", os: "Windows 11", browser: "Chrome", device: "Desktop" },
      { id: "env-4", os: "macOS 15", browser: "Safari", device: "Desktop" },
    ],
    releases: [],
    checklistTemplates: [],
    members: ["지민", "현우", "서연"],
    dailyReports: [],
  };
}
