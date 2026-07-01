import { useMemo } from "react";
import { Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useStore } from "../../../store/StoreContext";
import { STATUSES, STATUS_ORDER } from "../../../constants/types";
import "./PM.css";

export default function WorkloadView() {
  const { state } = useStore();

  const workloadData = useMemo(() => {
    const map = {};
    state.items.forEach((i) => {
      const name = i.assignee || "미배정";
      if (!map[name]) map[name] = { name, todo: 0, in_progress: 0, review: 0, done: 0, total: 0 };
      map[name][i.status]++;
      map[name].total++;
    });
    return Object.values(map).sort((a, b) => (b.total - b.done) - (a.total - a.done));
  }, [state.items]);

  const chartData = useMemo(() =>
    workloadData.map((w) => ({
      name: w.name,
      대기: w.todo,
      진행중: w.in_progress,
      검토: w.review,
      완료: w.done,
    })),
    [workloadData]
  );

  return (
    <div>
      <h2 className="tm-title" style={{ marginBottom: 20 }}><Users size={18} /> QA 워크로드</h2>

      <div className="rs-card" style={{ marginBottom: 20 }}>
        <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600 }}>담당자별 업무 분포</h4>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--line2)" />
              <XAxis type="number" fontSize={11} allowDecimals={false} />
              <YAxis type="category" dataKey="name" fontSize={12} width={70} />
              <Tooltip />
              <Legend fontSize={11} />
              <Bar dataKey="대기" stackId="a" fill={STATUSES.todo.color} />
              <Bar dataKey="진행중" stackId="a" fill={STATUSES.in_progress.color} />
              <Bar dataKey="검토" stackId="a" fill={STATUSES.review.color} />
              <Bar dataKey="완료" stackId="a" fill={STATUSES.done.color} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : <p className="muted">데이터가 없습니다.</p>}
      </div>

      <div className="rs-card">
        <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600 }}>상세 워크로드</h4>
        {workloadData.map((w) => {
          const active = w.total - w.done;
          return (
            <div key={w.name} className="workload-bar">
              <div className="workload-name">{w.name}</div>
              <div className="workload-track">
                {STATUS_ORDER.map((s) => {
                  const count = w[s];
                  if (!count) return null;
                  const pct = (count / w.total) * 100;
                  return (
                    <div key={s} className="workload-seg" style={{ width: `${pct}%`, background: STATUSES[s].color }}>
                      {count > 0 && pct > 8 ? count : ""}
                    </div>
                  );
                })}
              </div>
              <div className="workload-count" style={{ color: active > 4 ? "#F43F5E" : active > 2 ? "#F59E0B" : "var(--ink)" }}>
                {active}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
