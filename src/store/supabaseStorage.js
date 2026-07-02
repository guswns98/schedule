import { supabase } from "../lib/supabase";

/* ---- helpers ---- */
function toSnake(item) {
  const { startDate, dueDate, releaseId, createdAt, n, ...rest } = item;
  return {
    ...rest,
    start_date: startDate ?? null,
    due_date: dueDate ?? null,
    release_id: releaseId ?? null,
    created_at: createdAt ?? null,
  };
}

function toCamel(row) {
  const { start_date, due_date, release_id, created_at, ...rest } = row;
  return {
    ...rest,
    startDate: start_date ?? null,
    dueDate: due_date ?? null,
    releaseId: release_id ?? null,
    createdAt: created_at ?? null,
  };
}

/* ---- Fetch all data ---- */
export async function fetchAll() {
  const [
    { data: items },
    { data: testCases },
    { data: testRuns },
    { data: regressionSets },
    { data: bugRepro },
    { data: releases },
    { data: templates },
    { data: reports },
    { data: configRows },
  ] = await Promise.all([
    supabase.from("items").select("*"),
    supabase.from("test_cases").select("*"),
    supabase.from("test_runs").select("*"),
    supabase.from("regression_sets").select("*"),
    supabase.from("bug_repro").select("*"),
    supabase.from("releases").select("*"),
    supabase.from("checklist_templates").select("*"),
    supabase.from("daily_reports").select("*"),
    supabase.from("config").select("*"),
  ]);

  const config = {};
  for (const row of configRows || []) {
    config[row.key] = row.value;
  }

  const bugReproData = {};
  for (const row of bugRepro || []) {
    bugReproData[row.item_id] = row.data;
  }

  return {
    version: 2,
    items: (items || []).map(toCamel),
    testCases: (testCases || []).map((r) => ({ id: r.id, ...r.data })),
    testRuns: (testRuns || []).map((r) => ({ id: r.id, ...r.data })),
    regressionSets: (regressionSets || []).map((r) => ({ id: r.id, ...r.data })),
    bugReproData,
    releases: (releases || []).map((r) => ({ id: r.id, ...r.data })),
    checklistTemplates: (templates || []).map((r) => ({ id: r.id, ...r.data })),
    dailyReports: (reports || []).map((r) => ({ id: r.id, ...r.data })),
    seq: config.seq || { task: 0, bug: 0, test: 0, milestone: 0 },
    members: config.members || [],
    featureAreas: config.featureAreas || [],
    environments: config.environments || [],
  };
}

/* ---- Items ---- */
export async function upsertItem(item) {
  const row = toSnake(item);
  const { error } = await supabase.from("items").upsert(row);
  if (error) console.error("upsertItem error:", error);
}

export async function removeItem(id) {
  await supabase.from("items").delete().eq("id", id);
}

export async function updateItemStatus(id, status) {
  await supabase.from("items").update({ status }).eq("id", id);
}

/* ---- JSONB collections (generic) ---- */
async function upsertJsonb(table, id, data) {
  const { id: _, ...rest } = data;
  await supabase.from(table).upsert({ id, data: rest });
}

async function removeJsonb(table, id) {
  await supabase.from(table).delete().eq("id", id);
}

/* ---- Test Cases ---- */
export async function upsertTestCase(tc) {
  await upsertJsonb("test_cases", tc.id, tc);
}
export async function removeTestCase(id) {
  await removeJsonb("test_cases", id);
}

/* ---- Test Runs ---- */
export async function addTestRun(run) {
  await upsertJsonb("test_runs", run.id, run);
}
export async function removeTestRun(id) {
  await removeJsonb("test_runs", id);
}

/* ---- Regression Sets ---- */
export async function upsertRegressionSet(set) {
  await upsertJsonb("regression_sets", set.id, set);
}
export async function removeRegressionSet(id) {
  await removeJsonb("regression_sets", id);
}

/* ---- Bug Repro ---- */
export async function updateBugRepro(itemId, data) {
  await supabase.from("bug_repro").upsert({ item_id: itemId, data });
}

/* ---- Releases ---- */
export async function upsertRelease(rel) {
  await upsertJsonb("releases", rel.id, rel);
}
export async function removeRelease(id) {
  await removeJsonb("releases", id);
}

/* ---- Checklist Templates ---- */
export async function upsertTemplate(tpl) {
  await upsertJsonb("checklist_templates", tpl.id, tpl);
}
export async function removeTemplate(id) {
  await removeJsonb("checklist_templates", id);
}

/* ---- Daily Reports ---- */
export async function addDailyReport(report) {
  await upsertJsonb("daily_reports", report.id, report);
}

/* ---- Config ---- */
export async function updateConfig(key, value) {
  await supabase.from("config").upsert({ key, value });
}

/* ---- Environments ---- */
export async function setEnvironments(envs) {
  await updateConfig("environments", envs);
}

/* ---- Members ---- */
export async function setMembers(members) {
  await updateConfig("members", members);
}

/* ---- Feature Areas ---- */
export async function setFeatureAreas(areas) {
  await updateConfig("featureAreas", areas);
}

/* ---- Seq ---- */
export async function updateSeq(seq) {
  await updateConfig("seq", seq);
}
