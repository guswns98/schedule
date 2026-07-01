import { useMemo } from "react";
import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useStore } from "../../../store/StoreContext";
import "./QA.css";

const COLORS = ["#F43F5E", "#F59E0B", "#3B82F6", "#10B981", "#8B5CF6", "#EC4899"];

export default function DefectDensity() {
  const { state } = useStore();
  const bugs = state.items.filter((i) => i.type === "bug");

  const byModule = useMemo(() => {
    const map = {};
    bugs.forEach((b) => {
      const m = b.module || "미지정";
      map[m] = (map[m] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [bugs]);

  const byStatus = useMemo(() => {
    const map = { todo: 0, in_progress: 0, review: 0, done: 0 };
    bugs.forEach((b) => { map[b.status] = (map[b.status] || 0) + 1; });
    const labels = { todo: "대기", in_progress: "진행중", review: "검토", done: "완료" };
    const colors = { todo: "#94A3B8", in_progress: "#F59E0B", review: "#8B5CF6", done: "#10B981" };
    return Object.entries(map).filter(([_, v]) => v > 0).map(([k, v]) => ({ name: labels[k], value: v, color: colors[k] }));
  }, [bugs]);

  const byPriority = useMemo(() => {
    const map = { critical: 0, high: 0, medium: 0, low: 0 };
    bugs.forEach((b) => { map[b.priority] = (map[b.priority] || 0) + 1; });
    const labels = { critical: "긴급", high: "높음", medium: "보통", low: "낮음" };
    const colors = { critical: "#DC2626", high: "#EA580C", medium: "#2563EB", low: "#64748B" };
    return Object.entries(map).filter(([_, v]) => v > 0).map(([k, v]) => ({ name: labels[k], count: v, fill: colors[k] }));
  }, [bugs]);

  const bySprint = useMemo(() => {
    const map = {};
    bugs.forEach((b) => {
      const s = b.sprint || "미지정";
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [bugs]);

  return (
    <div>
      <h2 className="tm-title" style={{ marginBottom: 20 }}><BarChart3 size={18} /> 결함 밀도 대시보드</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12, marginBottom: 24 }}>
        <div className="rs-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#F43F5E" }}>{bugs.length}</div>
          <div className="muted" style={{ fontSize: 12 }}>전체 버그</div>
        </div>
        <div className="rs-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#F59E0B" }}>{bugs.filter((b) => b.status !== "done").length}</div>
          <div className="muted" style={{ fontSize: 12 }}>미해결</div>
        </div>
        <div className="rs-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#DC2626" }}>{bugs.filter((b) => b.priority === "critical").length}</div>
          <div className="muted" style={{ fontSize: 12 }}>긴급</div>
        </div>
        <div className="rs-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#10B981" }}>{bugs.filter((b) => b.status === "done").length}</div>
          <div className="muted" style={{ fontSize: 12 }}>해결 완료</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div className="rs-card">
          <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600 }}>모듈별 버그 수</h4>
          {byModule.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byModule}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line2)" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#F43F5E" radius={[4, 4, 0, 0]} name="버그 수" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="muted" style={{ fontSize: 12 }}>데이터가 없습니다.</p>}
        </div>

        <div className="rs-card">
          <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600 }}>상태별 분포</h4>
          {byStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={byStatus} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                  {byStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="muted" style={{ fontSize: 12 }}>데이터가 없습니다.</p>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <div className="rs-card">
          <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600 }}>우선순위별</h4>
          {byPriority.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byPriority} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line2)" />
                <XAxis type="number" fontSize={11} allowDecimals={false} />
                <YAxis type="category" dataKey="name" fontSize={11} width={50} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} name="버그 수">
                  {byPriority.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="muted" style={{ fontSize: 12 }}>데이터가 없습니다.</p>}
        </div>

        <div className="rs-card">
          <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600 }}>스프린트별 추이</h4>
          {bySprint.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={bySprint}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line2)" />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="버그 수" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="muted" style={{ fontSize: 12 }}>데이터가 없습니다.</p>}
        </div>
      </div>
    </div>
  );
}
