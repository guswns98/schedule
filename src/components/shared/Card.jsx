import { AlertTriangle } from "lucide-react";
import { STATUSES, PRIORITIES } from "../../constants/types";
import { todayISO, fmtShort } from "../../utils/date";
import TypeChip from "./TypeChip";

export default function Card({ item, onOpen, draggable, onDragStart }) {
  const st = STATUSES[item.status];
  const pr = PRIORITIES[item.priority];
  const late = item.dueDate && item.status !== "done" && item.dueDate < todayISO();

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
