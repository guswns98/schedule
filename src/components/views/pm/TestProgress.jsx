import { useMemo } from "react";
import { TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts";
import { useStore } from "../../../store/StoreContext";
import "./PM.css";

const RESULT_COLORS = { pass: "#10B981", fail: "#F43F5E", skip: "#94A3B8", blocked: "#F59E0B" };

export default function TestProgress() {
  const { state } = useStore();

  const summary = useMemo(() => {
    const total = state.testCases.length;
    const results = { pass: 0, fail: 0, skip: 0, blocked: 0, noRun: 0 };

    state.testCases.forEach((tc) => {
      const runs = state.testRuns.filter((r) => r.testCaseId === tc.id);
      if (runs.length === 0) { results.noRun++; return; }
      const last = runs[runs.length - 1];
      results[last.result]++;
    });

    const executed = total - results.noRun;
    const pct = total > 0 ? Math.round((executed / total) * 100) : 0;
    const passRate = executed > 0 ? Math.round((results.pass / executed) * 100) : 0;

    return { total, executed, pct, passRate, ...results };
  }, [state.testCases, state.testRuns]);

  const pieData = useMemo(() => {
    const data = [];
    if (summary.pass) data.push({ name: "Pass", value: summary.pass, color: RESULT_COLORS.pass });
    if (summary.fail) data.push({ name: "Fail", value: summary.fail, color: RESULT_COLORS.fail });
    if (summary.skip) data.push({ name: "Skip", value: summary.skip, color: RESULT_COLORS.skip });
    if (summary.blocked) data.push({ name: "Blocked", value: summary.blocked, color: RESULT_COLORS.blocked });
    if (summary.noRun) data.push({ name: "미실행", value: summary.noRun, color: "#E5E7EB" });
    return data;
  }, [summary]);

  // Burndown: cumulative test executions over time
  const burndown = useMemo(() => {
    if (state.testRuns.length === 0) return [];
    const sorted = [...state.testRuns].sort((a, b) => a.executedAt - b.executedAt);
    const map = {};
    sorted.forEach((r) => {
      const date = new Date(r.executedAt).toLocaleDateString("ko");
      if (!map[date]) map[date] = { date, total: 0, pass: 0, fail: 0 };
      map[date].total++;
      if (r.result === "pass") map[date].pass++;
      if (r.result === "fail") map[date].fail++;
    });
    let cumTotal = 0, cumPass = 0;
    return Object.values(map).map((d) => {
      cumTotal += d.total;
      cumPass += d.pass;
      return { ...d, 누적실행: cumTotal, 누적Pass: cumPass };
    });
  }, [state.testRuns]);

  return (
    <div>
      <h2 className="tm-title" style={{ marginBottom: 20 }}><TrendingUp size={18} /> 테스트 진행률</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12, marginBottom: 24 }}>
        <div className="rs-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{summary.total}</div>
          <div className="muted" style={{ fontSize: 12 }}>전체 케이스</div>
        </div>
        <div className="rs-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--accent)" }}>{summary.pct}%</div>
          <div className="muted" style={{ fontSize: 12 }}>실행률</div>
        </div>
        <div className="rs-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#10B981" }}>{summary.passRate}%</div>
          <div className="muted" style={{ fontSize: 12 }}>Pass Rate</div>
        </div>
        <div className="rs-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#F43F5E" }}>{summary.fail}</div>
          <div className="muted" style={{ fontSize: 12 }}>Fail</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
        <div className="rs-card">
          <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600 }}>결과 분포</h4>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value"
                  label={({ name, value }) => `${name} (${value})`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="tm-empty"><p className="muted">데이터가 없습니다.</p></div>}
        </div>

        <div className="rs-card">
          <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600 }}>실행 추이 (번다운)</h4>
          {burndown.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={burndown}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--line2)" />
                <XAxis dataKey="date" fontSize={10} />
                <YAxis fontSize={11} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="누적실행" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="누적Pass" stroke="#10B981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <div className="tm-empty"><p className="muted">실행 기록이 없습니다.</p></div>}
        </div>
      </div>

      <div className="rs-card">
        <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 600 }}>진행 바</h4>
        <div style={{ display: "flex", height: 32, borderRadius: 8, overflow: "hidden", background: "var(--line2)" }}>
          {pieData.filter((d) => d.value > 0).map((d, i) => (
            <div key={i} style={{
              width: `${(d.value / summary.total) * 100}%`,
              background: d.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "#fff", minWidth: d.value > 0 ? 20 : 0,
            }}>
              {(d.value / summary.total) * 100 > 8 ? `${d.name} ${d.value}` : ""}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
