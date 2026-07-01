import { useState, useMemo } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "../../../store/StoreContext";
import { toISO, todayISO, parseISO } from "../../../utils/date";
import { STATUSES } from "../../../constants/types";
import "./PM.css";

export default function ReleaseCalendar() {
  const { state } = useStore();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const y = cursor.getFullYear(), m = cursor.getMonth();
  const first = new Date(y, m, 1);
  const startPad = first.getDay();
  const daysIn = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(new Date(y, m, d));
  while (cells.length % 7) cells.push(null);

  const today = todayISO();
  const week = ["일", "월", "화", "수", "목", "금", "토"];

  // Build release date ranges and item due dates
  const getEvents = (iso) => {
    const events = [];

    // Release events
    state.releases.forEach((rel) => {
      if (rel.qaStartDate === iso) events.push({ type: "qa-start", label: `${rel.name} QA 시작`, color: "#F59E0B" });
      if (rel.targetDate === iso) events.push({ type: "target", label: `${rel.name} 목표일`, color: "#8B5CF6" });
      if (rel.deployDate === iso) events.push({ type: "deploy", label: `${rel.name} 배포`, color: "#10B981" });
    });

    // Item due dates
    state.items.forEach((item) => {
      if (item.dueDate === iso) {
        events.push({ type: "item", label: `${item.code} ${item.title}`, color: STATUSES[item.status].color });
      }
    });

    return events;
  };

  // Release bands (QA period visualization)
  const releaseBands = useMemo(() => {
    return state.releases.map((rel) => ({
      ...rel,
      qaStart: parseISO(rel.qaStartDate),
      target: parseISO(rel.targetDate),
      deploy: parseISO(rel.deployDate),
    }));
  }, [state.releases]);

  const isInRange = (iso, start, end) => {
    return iso >= start && iso <= end;
  };

  return (
    <div>
      <h2 className="tm-title" style={{ marginBottom: 16 }}><CalendarDays size={18} /> 릴리스 캘린더</h2>

      {state.releases.length > 0 && (
        <div style={{ display: "flex", gap: 16, marginBottom: 12, fontSize: 11 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "#F59E0B" }} /> QA 기간
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "#8B5CF6" }} /> 목표일
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: "#10B981" }} /> 배포일
          </span>
        </div>
      )}

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
            const events = iso ? getEvents(iso) : [];
            const inQa = iso && releaseBands.some((r) => r.qaStartDate && r.targetDate && isInRange(iso, r.qaStartDate, r.targetDate));

            return (
              <div key={k} className={`cal-cell ${!c ? "pad" : ""} ${iso === today ? "today" : ""}`}
                style={inQa ? { background: "rgba(245,158,11,.06)" } : {}}>
                {c ? <div className="cal-day">{c.getDate()}</div> : null}
                <div className="cal-items">
                  {events.slice(0, 4).map((ev, i) => (
                    <div key={i} className="cal-pill" style={{ "--st": ev.color, fontSize: 10 }}>
                      {ev.label}
                    </div>
                  ))}
                  {events.length > 4 && <div className="cal-more">+{events.length - 4}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
