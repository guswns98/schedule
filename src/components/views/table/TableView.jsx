import { useState, useMemo } from "react";
import { PRIORITIES, STATUS_ORDER } from "../../../constants/types";
import { fmtShort, todayISO } from "../../../utils/date";
import TypeChip from "../../shared/TypeChip";
import StatusBadge from "../../shared/StatusBadge";

export default function TableView({ items, onOpen }) {
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
