import { useMemo } from "react";
import { Flag } from "lucide-react";
import { STATUSES, TYPES } from "../../../constants/types";
import { parseISO, daysBetween, addDays } from "../../../utils/date";

export default function TimelineView({ items, onOpen }) {
  const rows = useMemo(
    () => [...items].sort((a, b) => (a.startDate || a.dueDate || "").localeCompare(b.startDate || b.dueDate || "")),
    [items]
  );

  const { start, end, months, todayPct } = useMemo(() => {
    const dates = [];
    items.forEach((i) => {
      if (i.startDate) dates.push(parseISO(i.startDate));
      if (i.dueDate) dates.push(parseISO(i.dueDate));
    });
    let min = dates.length ? new Date(Math.min(...dates)) : new Date();
    let max = dates.length ? new Date(Math.max(...dates)) : addDays(new Date(), 14);
    min = addDays(min, -3);
    max = addDays(max, 3);
    if (daysBetween(min, max) < 14) max = addDays(min, 14);
    const total = daysBetween(min, max) || 1;
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
