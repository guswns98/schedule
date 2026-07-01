import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { STATUSES } from "../../../constants/types";
import { toISO, todayISO } from "../../../utils/date";

export default function CalendarView({ items, onOpen }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
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
