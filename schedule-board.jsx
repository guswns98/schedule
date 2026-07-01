import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  LayoutGrid, GanttChartSquare, Calendar as CalendarIcon, Table2,
  Plus, Search, RefreshCw, X, Trash2, Users, ChevronLeft, ChevronRight,
  Bug, CheckSquare, FlaskConical, Flag, AlertTriangle
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Domain config                                                     */
/* ------------------------------------------------------------------ */

const TYPES = {
  task:      { label: "태스크",     prefix: "TASK", color: "#3B82F6", Icon: CheckSquare },
  bug:       { label: "버그",       prefix: "BUG",  color: "#F43F5E", Icon: Bug },
  test:      { label: "테스트",     prefix: "TEST", color: "#06B6D4", Icon: FlaskConical },
  milestone: { label: "마일스톤",   prefix: "MILE", color: "#D97706", Icon: Flag },
};

const STATUSES = {
  todo:        { label: "대기",   color: "#94A3B8" },
  in_progress: { label: "진행중", color: "#F59E0B" },
  review:      { label: "검토",   color: "#8B5CF6" },
  done:        { label: "완료",   color: "#10B981" },
};
const STATUS_ORDER = ["todo", "in_progress", "review", "done"];

const PRIORITIES = {
  critical: { label: "긴급", color: "#DC2626", rank: 0 },
  high:     { label: "높음", color: "#EA580C", rank: 1 },
  medium:   { label: "보통", color: "#2563EB", rank: 2 },
  low:      { label: "낮음", color: "#64748B", rank: 3 },
};

const VIEWS = [
  { id: "board",    label: "칸반",     Icon: LayoutGrid },
  { id: "timeline", label: "타임라인", Icon: GanttChartSquare },
  { id: "calendar", label: "캘린더",   Icon: CalendarIcon },
  { id: "table",    label: "테이블",   Icon: Table2 },
];

const STORAGE_KEY = "board-data";

/* ------------------------------------------------------------------ */
/*  Date helpers                                                      */
/* ------------------------------------------------------------------ */

const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = (s) => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
const todayISO = () => toISO(new Date());
const fmtShort = (s) => {
  const d = parseISO(s);
  return d ? `${d.getMonth() + 1}/${d.getDate()}` : "—";
};
const daysBetween = (a, b) => Math.round((b - a) / 86400000);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

/* ------------------------------------------------------------------ */
/*  Seed data (only written if storage is empty)                      */
/* ------------------------------------------------------------------ */

function seedData() {
  const base = new Date();
  const d = (n) => toISO(addDays(base, n));
  const mk = (o, i) => ({
    id: `seed-${i}`,
    code: `${TYPES[o.type].prefix}-${pad(o.n)}`,
    tags: [],
    description: "",
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
  return { items, seq: { task: 2, bug: 2, test: 2, milestone: 1 } };
}

/* ------------------------------------------------------------------ */
/*  Storage layer (shared across everyone who opens this artifact)    */
/* ------------------------------------------------------------------ */

const hasStore = typeof window !== "undefined" && window.storage;

async function loadStore() {
  if (!hasStore) return null;
  try {
    const res = await window.storage.get(STORAGE_KEY, true);
    return res ? JSON.parse(res.value) : null;
  } catch {
    return null; // key doesn't exist yet
  }
}
async function saveStore(data) {
  if (!hasStore) return;
  try {
    await window.storage.set(STORAGE_KEY, JSON.stringify(data), true);
  } catch (e) {
    console.error("save failed", e);
  }
}

/* ================================================================== */
/*  App                                                               */
/* ================================================================== */

export default function App() {
  const [data, setData] = useState({ items: [], seq: {} });
  const [view, setView] = useState("board");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // item or "new"
  const [q, setQ] = useState("");
  const [fType, setFType] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fAssignee, setFAssignee] = useState("all");

  /* ---- initial load ---- */
  useEffect(() => {
    (async () => {
      let d = await loadStore();
      if (!d) { d = seedData(); await saveStore(d); }
      setData(d);
      setLoading(false);
    })();
  }, []);

  const refresh = useCallback(async () => {
    setSaving(true);
    const d = await loadStore();
    if (d) setData(d);
    setSaving(false);
  }, []);

  /* refresh when window regains focus (catch teammates' edits) */
  useEffect(() => {
    const h = () => { if (!loading) refresh(); };
    window.addEventListener("focus", h);
    return () => window.removeEventListener("focus", h);
  }, [loading, refresh]);

  /* ---- persistence helper ---- */
  const commit = useCallback(async (next) => {
    setData(next);
    setSaving(true);
    await saveStore(next);
    setSaving(false);
  }, []);

  /* ---- CRUD ---- */
  const upsert = (item) => {
    let next;
    if (item.id) {
      next = { ...data, items: data.items.map((i) => (i.id === item.id ? item : i)) };
    } else {
      const seq = { ...data.seq };
      seq[item.type] = (seq[item.type] || 0) + 1;
      const created = {
        ...item,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        code: `${TYPES[item.type].prefix}-${pad(seq[item.type])}`,
        createdAt: Date.now(),
      };
      next = { ...data, seq, items: [...data.items, created] };
    }
    commit(next);
    setEditing(null);
  };
  const remove = (id) => {
    commit({ ...data, items: data.items.filter((i) => i.id !== id) });
    setEditing(null);
  };
  const setStatus = (id, status) =>
    commit({ ...data, items: data.items.map((i) => (i.id === id ? { ...i, status } : i)) });

  /* ---- derived ---- */
  const assignees = useMemo(
    () => Array.from(new Set(data.items.map((i) => i.assignee).filter(Boolean))).sort(),
    [data.items]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.items.filter((i) => {
      if (fType !== "all" && i.type !== fType) return false;
      if (fStatus !== "all" && i.status !== fStatus) return false;
      if (fAssignee !== "all" && i.assignee !== fAssignee) return false;
      if (needle) {
        const hay = `${i.code} ${i.title} ${i.assignee} ${(i.tags || []).join(" ")}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [data.items, q, fType, fStatus, fAssignee]);

  const anyFilter = fType !== "all" || fStatus !== "all" || fAssignee !== "all" || q.trim();
  const clearFilters = () => { setFType("all"); setFStatus("all"); setFAssignee("all"); setQ(""); };

  return (
    <div className="app">
      <style>{CSS}</style>

      {/* ---------- Header ---------- */}
      <header className="hdr">
        <div className="hdr-brand">
          <div className="hdr-mark">QA<span>/</span>PM</div>
          <div className="hdr-sub">
            통합 일정 보드
            <span className="share-note"><Users size={11} /> 팀 공유 · 여는 사람 모두 같은 데이터</span>
          </div>
        </div>
        <div className="hdr-actions">
          <button className="btn-ghost" onClick={refresh} title="새로고침">
            <RefreshCw size={15} className={saving ? "spin" : ""} />
          </button>
          <button className="btn-primary" onClick={() => setEditing("new")}>
            <Plus size={16} /> 항목 추가
          </button>
        </div>
      </header>

      {/* ---------- View tabs ---------- */}
      <nav className="tabs">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            className={`tab ${view === v.id ? "on" : ""}`}
            onClick={() => setView(v.id)}
          >
            <v.Icon size={15} /> {v.label}
          </button>
        ))}
        <div className="tabs-count">{filtered.length} / {data.items.length}개</div>
      </nav>

      {/* ---------- Filter bar ---------- */}
      <div className="filters">
        <div className="search">
          <Search size={14} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ID · 제목 · 담당자 · 태그 검색"
          />
        </div>
        <Select value={fType} onChange={setFType} label="유형"
          opts={[["all", "전체 유형"], ...Object.entries(TYPES).map(([k, v]) => [k, v.label])]} />
        <Select value={fStatus} onChange={setFStatus} label="상태"
          opts={[["all", "전체 상태"], ...Object.entries(STATUSES).map(([k, v]) => [k, v.label])]} />
        <Select value={fAssignee} onChange={setFAssignee} label="담당"
          opts={[["all", "전체 담당자"], ...assignees.map((a) => [a, a])]} />
        {anyFilter ? <button className="btn-clear" onClick={clearFilters}><X size={13} /> 초기화</button> : null}
      </div>

      {/* ---------- Body ---------- */}
      <main className="body">
        {loading ? (
          <div className="center muted">불러오는 중…</div>
        ) : data.items.length === 0 ? (
          <Empty onAdd={() => setEditing("new")} />
        ) : filtered.length === 0 ? (
          <div className="center muted">
            조건에 맞는 항목이 없어요. <button className="linkbtn" onClick={clearFilters}>필터 초기화</button>
          </div>
        ) : view === "board" ? (
          <BoardView items={filtered} onOpen={setEditing} onStatus={setStatus} />
        ) : view === "timeline" ? (
          <TimelineView items={filtered} onOpen={setEditing} />
        ) : view === "calendar" ? (
          <CalendarView items={filtered} onOpen={setEditing} />
        ) : (
          <TableView items={filtered} onOpen={setEditing} />
        )}
      </main>

      {editing ? (
        <ItemForm
          item={editing === "new" ? null : editing}
          onSave={upsert}
          onDelete={remove}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small shared bits                                                 */
/* ------------------------------------------------------------------ */

function Select({ value, onChange, opts, label }) {
  return (
    <label className="sel">
      <span className="sel-lb">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}

function TypeChip({ type }) {
  const t = TYPES[type];
  return (
    <span className="tchip" style={{ color: t.color, background: t.color + "18" }}>
      <t.Icon size={11} /> {t.label}
    </span>
  );
}

function Empty({ onAdd }) {
  return (
    <div className="center">
      <div className="empty">
        <div className="empty-title">아직 항목이 없어요</div>
        <p className="muted">태스크·버그·테스트·마일스톤을 한곳에서 추적해 보세요.</p>
        <button className="btn-primary" onClick={onAdd}><Plus size={16} /> 첫 항목 추가</button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Card (shared by board)                                            */
/* ------------------------------------------------------------------ */

function Card({ item, onOpen, draggable, onDragStart }) {
  const st = STATUSES[item.status];
  const pr = PRIORITIES[item.priority];
  const late =
    item.dueDate && item.status !== "done" && item.dueDate < todayISO();
  return (
    <div
      className="card"
      style={{ "--st": st.color }}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={() => onOpen(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" ? onOpen(item) : null)}
    >
      <div className="card-top">
        <span className="code">{item.code}</span>
        <span className="prio" style={{ color: pr.color }}>
          {item.priority === "critical" ? <AlertTriangle size={11} /> : null}{pr.label}
        </span>
      </div>
      <div className="card-title">{item.title}</div>
      <div className="card-meta">
        <TypeChip type={item.type} />
        {item.assignee ? <span className="who">{item.assignee}</span> : null}
        <span className={`due ${late ? "late" : ""}`}>~{fmtShort(item.dueDate)}</span>
      </div>
      {item.tags?.length ? (
        <div className="tags">{item.tags.map((t) => <span key={t} className="tag">#{t}</span>)}</div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Board (Kanban)                                                    */
/* ------------------------------------------------------------------ */

function BoardView({ items, onOpen, onStatus }) {
  const [over, setOver] = useState(null);
  const dragId = useRef(null);
  return (
    <div className="board">
      {STATUS_ORDER.map((s) => {
        const col = items.filter((i) => i.status === s);
        const st = STATUSES[s];
        return (
          <div
            key={s}
            className={`col ${over === s ? "over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setOver(s); }}
            onDragLeave={() => setOver((o) => (o === s ? null : o))}
            onDrop={() => { if (dragId.current) onStatus(dragId.current, s); dragId.current = null; setOver(null); }}
          >
            <div className="col-hd">
              <span className="dot" style={{ background: st.color }} />
              {st.label}
              <span className="col-n">{col.length}</span>
            </div>
            <div className="col-body">
              {col.map((i) => (
                <Card key={i.id} item={i} onOpen={onOpen} draggable
                  onDragStart={() => (dragId.current = i.id)} />
              ))}
              {col.length === 0 ? <div className="col-empty">비어 있음</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Timeline (mini gantt)                                             */
/* ------------------------------------------------------------------ */

function TimelineView({ items, onOpen }) {
  const rows = useMemo(
    () => [...items].sort((a, b) => (a.startDate || a.dueDate || "").localeCompare(b.startDate || b.dueDate || "")),
    [items]
  );

  const { start, end, months, todayPct } = useMemo(() => {
    const dates = [];
    items.forEach((i) => { if (i.startDate) dates.push(parseISO(i.startDate)); if (i.dueDate) dates.push(parseISO(i.dueDate)); });
    let min = dates.length ? new Date(Math.min(...dates)) : new Date();
    let max = dates.length ? new Date(Math.max(...dates)) : addDays(new Date(), 14);
    min = addDays(min, -3); max = addDays(max, 3);
    if (daysBetween(min, max) < 14) max = addDays(min, 14);
    const total = daysBetween(min, max) || 1;
    // month ticks
    const ticks = [];
    let cur = new Date(min.getFullYear(), min.getMonth(), 1);
    while (cur <= max) {
      const off = daysBetween(min, cur);
      ticks.push({ label: `${cur.getMonth() + 1}월`, pct: Math.max(0, (off / total) * 100) });
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    const t = new Date();
    const tp = ((daysBetween(min, t)) / total) * 100;
    return { start: min, end: max, months: ticks, todayPct: tp >= 0 && tp <= 100 ? tp : null };
  }, [items]);

  const total = daysBetween(start, end) || 1;
  const geo = (i) => {
    const s = parseISO(i.startDate || i.dueDate);
    const e = parseISO(i.dueDate || i.startDate);
    if (!s || !e) return null;
    const l = (daysBetween(start, s) / total) * 100;
    const w = Math.max((daysBetween(s, e) / total) * 100, 1.4);
    return { left: `${l}%`, width: `${w}%` };
  };

  return (
    <div className="tl">
      <div className="tl-axis">
        <div className="tl-lbl-col" />
        <div className="tl-track">
          {months.map((m, k) => <div key={k} className="tl-mtick" style={{ left: `${m.pct}%` }}>{m.label}</div>)}
          {todayPct != null ? <div className="tl-today" style={{ left: `${todayPct}%` }}><span>오늘</span></div> : null}
        </div>
      </div>
      <div className="tl-rows">
        {rows.map((i) => {
          const g = geo(i);
          const st = STATUSES[i.status];
          const isMile = i.type === "milestone";
          return (
            <div key={i.id} className="tl-row" onClick={() => onOpen(i)}>
              <div className="tl-lbl-col">
                <span className="code">{i.code}</span>
                <span className="tl-name">{i.title}</span>
              </div>
              <div className="tl-track">
                {todayPct != null ? <div className="tl-today thin" style={{ left: `${todayPct}%` }} /> : null}
                {g ? (
                  isMile ? (
                    <div className="tl-mile" style={{ left: g.left, background: TYPES.milestone.color }} title={i.title}>
                      <Flag size={11} />
                    </div>
                  ) : (
                    <div className="tl-bar" style={{ ...g, background: st.color }}>
                      <span className="tl-bar-txt">{i.assignee || i.title}</span>
                    </div>
                  )
                ) : <div className="tl-nodate">날짜 없음</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Calendar (month)                                                  */
/* ------------------------------------------------------------------ */

function CalendarView({ items, onOpen }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const y = cursor.getFullYear(), m = cursor.getMonth();
  const first = new Date(y, m, 1);
  const startPad = first.getDay();
  const daysIn = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7) cells.push(null);

  const byDay = useMemo(() => {
    const map = {};
    items.forEach((i) => { if (i.dueDate) (map[i.dueDate] ||= []).push(i); });
    return map;
  }, [items]);

  const today = todayISO();
  const week = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="cal">
      <div className="cal-hd">
        <button className="btn-ghost" onClick={() => setCursor(new Date(y, m - 1, 1))}><ChevronLeft size={16} /></button>
        <div className="cal-title">{y}년 {m + 1}월</div>
        <button className="btn-ghost" onClick={() => setCursor(new Date(y, m + 1, 1))}><ChevronRight size={16} /></button>
        <button className="btn-clear" onClick={() => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); }}>오늘</button>
      </div>
      <div className="cal-grid">
        {week.map((w, i) => <div key={w} className={`cal-wd ${i === 0 ? "sun" : i === 6 ? "sat" : ""}`}>{w}</div>)}
        {cells.map((c, k) => {
          const iso = c ? toISO(c) : null;
          const list = iso ? byDay[iso] || [] : [];
          return (
            <div key={k} className={`cal-cell ${!c ? "pad" : ""} ${iso === today ? "today" : ""}`}>
              {c ? <div className="cal-day">{c.getDate()}</div> : null}
              <div className="cal-items">
                {list.slice(0, 4).map((i) => (
                  <button key={i.id} className="cal-pill" style={{ "--st": STATUSES[i.status].color }} onClick={() => onOpen(i)}>
                    <span className="cal-pill-code">{i.code}</span> {i.title}
                  </button>
                ))}
                {list.length > 4 ? <div className="cal-more">+{list.length - 4}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table                                                             */
/* ------------------------------------------------------------------ */

function TableView({ items, onOpen }) {
  const [sort, setSort] = useState({ key: "dueDate", dir: 1 });
  const sorted = useMemo(() => {
    const arr = [...items];
    const { key, dir } = sort;
    arr.sort((a, b) => {
      let av, bv;
      if (key === "priority") { av = PRIORITIES[a.priority].rank; bv = PRIORITIES[b.priority].rank; }
      else if (key === "status") { av = STATUS_ORDER.indexOf(a.status); bv = STATUS_ORDER.indexOf(b.status); }
      else { av = a[key] || ""; bv = b[key] || ""; }
      return av < bv ? -dir : av > bv ? dir : 0;
    });
    return arr;
  }, [items, sort]);

  const th = (key, label, cls = "") => (
    <th className={`${cls} ${sort.key === key ? "sorted" : ""}`}
      onClick={() => setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }))}>
      {label}{sort.key === key ? <span className="arr">{sort.dir === 1 ? "↑" : "↓"}</span> : null}
    </th>
  );

  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead>
          <tr>
            {th("code", "ID")}
            {th("type", "유형")}
            {th("title", "제목", "grow")}
            {th("status", "상태")}
            {th("priority", "우선순위")}
            {th("assignee", "담당")}
            {th("startDate", "시작")}
            {th("dueDate", "마감")}
          </tr>
        </thead>
        <tbody>
          {sorted.map((i) => {
            const late = i.dueDate && i.status !== "done" && i.dueDate < todayISO();
            return (
              <tr key={i.id} onClick={() => onOpen(i)}>
                <td className="code">{i.code}</td>
                <td><TypeChip type={i.type} /></td>
                <td className="grow">{i.title}
                  {i.tags?.length ? <span className="tbl-tags">{i.tags.map((t) => <span key={t} className="tag">#{t}</span>)}</span> : null}
                </td>
                <td><StatusBadge s={i.status} /></td>
                <td><span className="prio" style={{ color: PRIORITIES[i.priority].color }}>{PRIORITIES[i.priority].label}</span></td>
                <td>{i.assignee || "—"}</td>
                <td className="mono">{fmtShort(i.startDate)}</td>
                <td className={`mono ${late ? "late" : ""}`}>{fmtShort(i.dueDate)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ s }) {
  const st = STATUSES[s];
  return <span className="sbadge" style={{ color: st.color, background: st.color + "1c" }}>{st.label}</span>;
}

/* ------------------------------------------------------------------ */
/*  Item form modal                                                   */
/* ------------------------------------------------------------------ */

function ItemForm({ item, onSave, onDelete, onClose }) {
  const [f, setF] = useState(() => item || {
    type: "task", title: "", status: "todo", priority: "medium",
    assignee: "", startDate: todayISO(), dueDate: todayISO(), tags: [], description: "",
  });
  const [tagInput, setTagInput] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const valid = f.title.trim().length > 0;

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !(f.tags || []).includes(t)) set("tags", [...(f.tags || []), t]);
    setTagInput("");
  };

  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <div className="modal-title">
            {item ? <span className="code">{item.code}</span> : "새 항목"}
            {item ? <span className="modal-editing">편집</span> : null}
          </div>
          <button className="btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <label className="fld">
            <span>제목</span>
            <input autoFocus value={f.title} onChange={(e) => set("title", e.target.value)}
              placeholder="무엇을 하나요?" />
          </label>

          <div className="fld-row">
            <label className="fld">
              <span>유형</span>
              <div className="segset">
                {Object.entries(TYPES).map(([k, v]) => (
                  <button key={k} type="button"
                    className={`seg ${f.type === k ? "on" : ""}`}
                    style={f.type === k ? { color: v.color, borderColor: v.color, background: v.color + "14" } : {}}
                    onClick={() => set("type", k)}>
                    <v.Icon size={13} /> {v.label}
                  </button>
                ))}
              </div>
            </label>
          </div>

          <div className="fld-row">
            <label className="fld">
              <span>상태</span>
              <select value={f.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </label>
            <label className="fld">
              <span>우선순위</span>
              <select value={f.priority} onChange={(e) => set("priority", e.target.value)}>
                {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </label>
            <label className="fld">
              <span>담당자</span>
              <input value={f.assignee} onChange={(e) => set("assignee", e.target.value)} placeholder="이름" />
            </label>
          </div>

          <div className="fld-row">
            <label className="fld">
              <span>시작일</span>
              <input type="date" value={f.startDate || ""} onChange={(e) => set("startDate", e.target.value)} />
            </label>
            <label className="fld">
              <span>마감일</span>
              <input type="date" value={f.dueDate || ""} onChange={(e) => set("dueDate", e.target.value)} />
            </label>
          </div>

          <label className="fld">
            <span>태그</span>
            <div className="tag-edit">
              {(f.tags || []).map((t) => (
                <span key={t} className="tag rm" onClick={() => set("tags", f.tags.filter((x) => x !== t))}>
                  #{t} <X size={10} />
                </span>
              ))}
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => (e.key === "Enter" ? (e.preventDefault(), addTag()) : null)}
                placeholder="태그 입력 후 Enter" />
            </div>
          </label>

          <label className="fld">
            <span>설명</span>
            <textarea value={f.description} onChange={(e) => set("description", e.target.value)}
              rows={3} placeholder="재현 절차, 완료 조건 등" />
          </label>
        </div>

        <div className="modal-ft">
          {item ? (
            <button className="btn-danger" onClick={() => onDelete(item.id)}><Trash2 size={14} /> 삭제</button>
          ) : <span />}
          <div className="modal-ft-r">
            <button className="btn-ghost pad" onClick={onClose}>취소</button>
            <button className="btn-primary" disabled={!valid} onClick={() => onSave({ ...f, title: f.title.trim() })}>
              {item ? "저장" : "추가"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Styles                                                            */
/* ================================================================== */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

.app{
  --bg:#F5F6F9; --surface:#FFFFFF; --ink:#171A23; --muted:#727889;
  --line:#E6E8EF; --line2:#EFF0F5; --accent:#4A45C9; --accent-h:#3D38B4;
  --font: 'Inter', system-ui, -apple-system, sans-serif;
  --mono:'JetBrains Mono', ui-monospace, Menlo, monospace;
  font-family:var(--font); color:var(--ink); background:var(--bg);
  min-height:100vh; display:flex; flex-direction:column;
  -webkit-font-smoothing:antialiased;
}
.app *{ box-sizing:border-box; }
.app button{ font-family:inherit; cursor:pointer; }
.muted{ color:var(--muted); }
.mono{ font-family:var(--mono); }
.code{ font-family:var(--mono); font-size:11px; font-weight:500; color:var(--muted); letter-spacing:.3px; }
.center{ display:flex; align-items:center; justify-content:center; min-height:340px; text-align:center; padding:24px; }
.linkbtn{ background:none; border:none; color:var(--accent); text-decoration:underline; padding:0; }
.spin{ animation:sp 1s linear infinite; } @keyframes sp{ to{ transform:rotate(360deg); } }

/* header */
.hdr{ display:flex; align-items:center; justify-content:space-between; gap:16px;
  padding:14px 20px; background:var(--surface); border-bottom:1px solid var(--line); }
.hdr-brand{ display:flex; align-items:center; gap:14px; min-width:0; }
.hdr-mark{ font-family:var(--mono); font-weight:600; font-size:15px; letter-spacing:.5px;
  color:var(--ink); background:var(--ink); color:#fff; padding:5px 9px; border-radius:6px; white-space:nowrap; }
.hdr-mark span{ color:var(--accent); opacity:.9; }
.hdr-sub{ font-size:13px; font-weight:600; display:flex; flex-direction:column; gap:2px; min-width:0; }
.share-note{ font-weight:400; font-size:11px; color:var(--muted); display:inline-flex; align-items:center; gap:4px; }
.hdr-actions{ display:flex; align-items:center; gap:8px; }

.btn-primary{ display:inline-flex; align-items:center; gap:6px; background:var(--accent); color:#fff;
  border:none; padding:8px 13px; border-radius:8px; font-size:13px; font-weight:600; }
.btn-primary:hover{ background:var(--accent-h); }
.btn-primary:disabled{ opacity:.45; cursor:not-allowed; }
.btn-ghost{ display:inline-flex; align-items:center; justify-content:center; background:none;
  border:1px solid transparent; color:var(--muted); padding:7px; border-radius:8px; }
.btn-ghost:hover{ background:var(--line2); color:var(--ink); }
.btn-ghost.pad{ padding:8px 12px; font-size:13px; font-weight:500; }
.btn-clear{ display:inline-flex; align-items:center; gap:4px; background:none; border:1px solid var(--line);
  color:var(--muted); font-size:12px; padding:6px 10px; border-radius:7px; }
.btn-clear:hover{ border-color:var(--muted); color:var(--ink); }
.btn-danger{ display:inline-flex; align-items:center; gap:6px; background:none; border:1px solid #F1C6CC;
  color:#DC2626; padding:8px 12px; border-radius:8px; font-size:13px; font-weight:500; }
.btn-danger:hover{ background:#FEF2F2; }

/* tabs */
.tabs{ display:flex; align-items:center; gap:4px; padding:0 20px; background:var(--surface);
  border-bottom:1px solid var(--line); }
.tab{ display:inline-flex; align-items:center; gap:6px; background:none; border:none;
  padding:11px 12px; font-size:13px; font-weight:500; color:var(--muted);
  border-bottom:2px solid transparent; margin-bottom:-1px; }
.tab:hover{ color:var(--ink); }
.tab.on{ color:var(--accent); border-bottom-color:var(--accent); font-weight:600; }
.tabs-count{ margin-left:auto; font-family:var(--mono); font-size:11px; color:var(--muted); }

/* filters */
.filters{ display:flex; align-items:center; gap:8px; padding:12px 20px; flex-wrap:wrap;
  border-bottom:1px solid var(--line); background:var(--surface); }
.search{ display:flex; align-items:center; gap:7px; background:var(--bg); border:1px solid var(--line);
  border-radius:8px; padding:0 10px; height:34px; flex:1; min-width:200px; color:var(--muted); }
.search input{ border:none; background:none; outline:none; font-size:13px; width:100%; color:var(--ink); font-family:inherit; }
.sel{ display:flex; align-items:center; gap:0; height:34px; }
.sel-lb{ display:none; }
.sel select, .filters select{ height:34px; border:1px solid var(--line); background:var(--surface);
  border-radius:8px; padding:0 26px 0 10px; font-size:13px; color:var(--ink); font-family:inherit;
  appearance:none; background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23727889' fill='none' stroke-width='1.5'/%3E%3C/svg%3E");
  background-repeat:no-repeat; background-position:right 10px center; }

/* body */
.body{ flex:1; overflow:auto; padding:18px 20px 40px; }
.empty{ display:flex; flex-direction:column; align-items:center; gap:10px; }
.empty-title{ font-size:17px; font-weight:600; }

/* card */
.card{ background:var(--surface); border:1px solid var(--line); border-left:3px solid var(--st);
  border-radius:9px; padding:10px 11px; display:flex; flex-direction:column; gap:7px;
  box-shadow:0 1px 2px rgba(20,25,45,.03); transition:box-shadow .12s, transform .12s; }
.card:hover{ box-shadow:0 4px 14px rgba(20,25,45,.09); }
.card:active{ cursor:grabbing; }
.card:focus-visible{ outline:2px solid var(--accent); outline-offset:1px; }
.card-top{ display:flex; align-items:center; justify-content:space-between; }
.prio{ font-size:11px; font-weight:600; display:inline-flex; align-items:center; gap:3px; }
.card-title{ font-size:13.5px; font-weight:600; line-height:1.35; }
.card-meta{ display:flex; align-items:center; gap:7px; flex-wrap:wrap; }
.tchip{ display:inline-flex; align-items:center; gap:3px; font-size:10.5px; font-weight:600;
  padding:2px 6px; border-radius:5px; }
.who{ font-size:11.5px; color:var(--muted); font-weight:500; }
.due{ font-family:var(--mono); font-size:11px; color:var(--muted); margin-left:auto; }
.due.late{ color:#DC2626; font-weight:600; }
.tags{ display:flex; gap:4px; flex-wrap:wrap; }
.tag{ font-size:10.5px; color:var(--muted); background:var(--line2); padding:1px 6px; border-radius:5px; font-family:var(--mono); }

/* board */
.board{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; align-items:start; }
.col{ background:rgba(0,0,0,.015); border:1px solid var(--line2); border-radius:11px; padding:9px;
  display:flex; flex-direction:column; gap:9px; min-height:120px; transition:background .12s, border-color .12s; }
.col.over{ background:rgba(74,69,201,.05); border-color:var(--accent); }
.col-hd{ display:flex; align-items:center; gap:7px; font-size:12.5px; font-weight:600; padding:2px 4px; }
.dot{ width:8px; height:8px; border-radius:50%; }
.col-n{ margin-left:auto; font-family:var(--mono); font-size:11px; color:var(--muted);
  background:var(--surface); border:1px solid var(--line); border-radius:20px; padding:1px 7px; }
.col-body{ display:flex; flex-direction:column; gap:8px; }
.col-empty{ font-size:12px; color:var(--muted); text-align:center; padding:14px 0; border:1px dashed var(--line); border-radius:8px; }

/* timeline */
.tl{ background:var(--surface); border:1px solid var(--line); border-radius:12px; overflow:hidden; }
.tl-lbl-col{ width:220px; flex:none; padding:0 12px; display:flex; align-items:center; gap:8px; min-width:0; }
.tl-track{ position:relative; flex:1; min-height:1px; }
.tl-axis{ display:flex; height:34px; border-bottom:1px solid var(--line); background:var(--bg); align-items:center; }
.tl-axis .tl-track{ height:100%; }
.tl-mtick{ position:absolute; top:0; bottom:0; display:flex; align-items:center; padding-left:6px;
  font-size:10.5px; color:var(--muted); font-family:var(--mono); border-left:1px solid var(--line2); }
.tl-today{ position:absolute; top:0; bottom:0; width:2px; background:#DC2626; z-index:3; }
.tl-today.thin{ opacity:.28; width:1.5px; }
.tl-today span{ position:absolute; top:2px; left:3px; font-size:9.5px; font-weight:700; color:#DC2626; font-family:var(--mono); }
.tl-rows{ max-height:520px; overflow:auto; }
.tl-row{ display:flex; align-items:stretch; height:40px; border-bottom:1px solid var(--line2); cursor:pointer; }
.tl-row:hover{ background:var(--bg); }
.tl-name{ font-size:12.5px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.tl-bar{ position:absolute; top:9px; height:22px; border-radius:6px; display:flex; align-items:center;
  padding:0 8px; overflow:hidden; box-shadow:0 1px 2px rgba(0,0,0,.12); }
.tl-bar-txt{ font-size:11px; font-weight:600; color:#fff; white-space:nowrap; text-shadow:0 1px 1px rgba(0,0,0,.15); }
.tl-mile{ position:absolute; top:9px; width:22px; height:22px; transform:translateX(-11px) rotate(45deg);
  border-radius:4px; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 3px rgba(0,0,0,.25); }
.tl-mile svg{ transform:rotate(-45deg); color:#fff; }
.tl-nodate{ position:absolute; top:11px; left:8px; font-size:11px; color:var(--muted); font-style:italic; }

/* calendar */
.cal{ background:var(--surface); border:1px solid var(--line); border-radius:12px; overflow:hidden; }
.cal-hd{ display:flex; align-items:center; gap:8px; padding:12px 14px; border-bottom:1px solid var(--line); }
.cal-title{ font-size:15px; font-weight:600; min-width:110px; }
.cal-hd .btn-clear{ margin-left:auto; }
.cal-grid{ display:grid; grid-template-columns:repeat(7,1fr); }
.cal-wd{ text-align:center; font-size:11.5px; font-weight:600; color:var(--muted); padding:8px 0;
  border-bottom:1px solid var(--line); background:var(--bg); }
.cal-wd.sun{ color:#DC2626; } .cal-wd.sat{ color:#2563EB; }
.cal-cell{ min-height:104px; border-right:1px solid var(--line2); border-bottom:1px solid var(--line2);
  padding:5px; display:flex; flex-direction:column; gap:3px; }
.cal-cell:nth-child(7n){ border-right:none; }
.cal-cell.pad{ background:var(--bg); }
.cal-cell.today{ background:rgba(74,69,201,.045); }
.cal-cell.today .cal-day{ background:var(--accent); color:#fff; }
.cal-day{ font-size:11.5px; font-weight:600; width:21px; height:21px; display:flex; align-items:center;
  justify-content:center; border-radius:6px; font-family:var(--mono); }
.cal-items{ display:flex; flex-direction:column; gap:3px; }
.cal-pill{ text-align:left; border:none; border-left:3px solid var(--st); background:var(--line2);
  border-radius:4px; padding:2px 5px; font-size:10.5px; font-weight:500; color:var(--ink);
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.cal-pill:hover{ background:var(--line); }
.cal-pill-code{ font-family:var(--mono); color:var(--muted); font-size:9.5px; }
.cal-more{ font-size:10px; color:var(--muted); padding-left:4px; }

/* table */
.tbl-wrap{ background:var(--surface); border:1px solid var(--line); border-radius:12px; overflow:auto; }
.tbl{ width:100%; border-collapse:collapse; font-size:13px; }
.tbl th{ text-align:left; font-size:11px; font-weight:600; color:var(--muted); text-transform:uppercase;
  letter-spacing:.4px; padding:11px 12px; border-bottom:1px solid var(--line); background:var(--bg);
  cursor:pointer; white-space:nowrap; user-select:none; position:sticky; top:0; }
.tbl th:hover{ color:var(--ink); }
.tbl th.sorted{ color:var(--accent); }
.tbl th .arr{ margin-left:3px; }
.tbl td{ padding:10px 12px; border-bottom:1px solid var(--line2); vertical-align:middle; }
.tbl tbody tr:last-child td, .tbl tbody tr:last-child td{ border-bottom:none; }
.tbl tbody tr{ cursor:pointer; }
.tbl tbody tr:hover{ background:var(--bg); }
.tbl .grow{ width:99%; font-weight:500; }
.tbl .late{ color:#DC2626; font-weight:600; }
.tbl-tags{ margin-left:8px; display:inline-flex; gap:4px; }
.sbadge{ font-size:11px; font-weight:600; padding:2px 8px; border-radius:6px; white-space:nowrap; }

/* modal */
.overlay{ position:fixed; inset:0; background:rgba(23,26,35,.42); backdrop-filter:blur(2px);
  display:flex; align-items:center; justify-content:center; padding:20px; z-index:50; }
.modal{ background:var(--surface); border-radius:14px; width:100%; max-width:560px; max-height:92vh;
  display:flex; flex-direction:column; box-shadow:0 20px 60px rgba(20,25,45,.3); overflow:hidden; }
.modal-hd{ display:flex; align-items:center; justify-content:space-between; padding:15px 18px;
  border-bottom:1px solid var(--line); }
.modal-title{ display:flex; align-items:center; gap:8px; font-size:15px; font-weight:600; }
.modal-editing{ font-size:11px; font-weight:600; color:var(--accent); background:rgba(74,69,201,.08);
  padding:2px 7px; border-radius:5px; }
.modal-body{ padding:16px 18px; overflow:auto; display:flex; flex-direction:column; gap:14px; }
.fld{ display:flex; flex-direction:column; gap:6px; flex:1; min-width:0; }
.fld>span{ font-size:11.5px; font-weight:600; color:var(--muted); }
.fld input, .fld select, .fld textarea{ border:1px solid var(--line); border-radius:8px; padding:8px 10px;
  font-size:13px; font-family:inherit; color:var(--ink); background:var(--surface); outline:none; width:100%; }
.fld input:focus, .fld select:focus, .fld textarea:focus{ border-color:var(--accent); box-shadow:0 0 0 3px rgba(74,69,201,.14); }
.fld textarea{ resize:vertical; }
.fld-row{ display:flex; gap:12px; }
.segset{ display:flex; gap:6px; flex-wrap:wrap; }
.seg{ display:inline-flex; align-items:center; gap:5px; border:1px solid var(--line); background:var(--surface);
  border-radius:8px; padding:7px 10px; font-size:12.5px; font-weight:500; color:var(--muted); }
.seg.on{ font-weight:600; }
.tag-edit{ display:flex; flex-wrap:wrap; gap:6px; align-items:center; border:1px solid var(--line);
  border-radius:8px; padding:6px 8px; }
.tag-edit input{ border:none; outline:none; padding:2px; font-size:13px; flex:1; min-width:120px; font-family:inherit; }
.tag.rm{ display:inline-flex; align-items:center; gap:3px; cursor:pointer; background:var(--line2); }
.tag.rm:hover{ background:#FEE2E2; color:#DC2626; }
.modal-ft{ display:flex; align-items:center; justify-content:space-between; padding:13px 18px;
  border-top:1px solid var(--line); }
.modal-ft-r{ display:flex; gap:8px; }

/* focus */
.app :focus-visible{ outline:2px solid var(--accent); outline-offset:1px; }

/* responsive */
@media (max-width:820px){
  .board{ grid-template-columns:repeat(2,1fr); }
  .tl-lbl-col{ width:130px; }
  .fld-row{ flex-direction:column; }
  .hdr-sub .share-note{ display:none; }
}
@media (max-width:520px){
  .board{ grid-template-columns:1fr; }
  .cal-cell{ min-height:72px; }
}
@media (prefers-reduced-motion:reduce){ .app *{ animation:none !important; transition:none !important; } }
`;
