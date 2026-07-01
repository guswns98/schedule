import { useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { useStore } from "../../../store/StoreContext";
import { todayISO } from "../../../utils/date";
import "./PM.css";

const RISK_FACTORS = [
  { id: "overdue", label: "마감 초과" },
  { id: "bugs", label: "오픈 버그" },
  { id: "coverage", label: "테스트 부족" },
  { id: "workload", label: "업무 과중" },
];

export default function RiskHeatmap() {
  const { state } = useStore();
  const today = todayISO();

  const modules = useMemo(() => {
    const set = new Set();
    state.items.forEach((i) => { if (i.module) set.add(i.module); });
    if (set.size === 0) set.add("전체");
    return Array.from(set).sort();
  }, [state.items]);

  const matrix = useMemo(() => {
    return modules.map((mod) => {
      const items = mod === "전체" ? state.items : state.items.filter((i) => i.module === mod);
      const bugs = items.filter((i) => i.type === "bug" && i.status !== "done");

      // Overdue items
      const overdue = items.filter((i) => i.dueDate && i.dueDate < today && i.status !== "done").length;
      const overdueRisk = overdue >= 3 ? 3 : overdue >= 2 ? 2 : overdue >= 1 ? 1 : 0;

      // Open bugs
      const bugCount = bugs.length;
      const bugRisk = bugCount >= 4 ? 3 : bugCount >= 2 ? 2 : bugCount >= 1 ? 1 : 0;

      // Test coverage
      const testCases = state.testCases.filter((tc) => tc.featureArea === mod);
      const covRisk = testCases.length === 0 ? 2 : testCases.length < 3 ? 1 : 0;

      // Workload (items per person)
      const assignees = {};
      items.filter((i) => i.status !== "done").forEach((i) => { if (i.assignee) assignees[i.assignee] = (assignees[i.assignee] || 0) + 1; });
      const maxLoad = Math.max(0, ...Object.values(assignees));
      const loadRisk = maxLoad >= 5 ? 3 : maxLoad >= 3 ? 2 : maxLoad >= 2 ? 1 : 0;

      return {
        module: mod,
        risks: { overdue: overdueRisk, bugs: bugRisk, coverage: covRisk, workload: loadRisk },
        values: { overdue, bugs: bugCount, coverage: testCases.length, workload: maxLoad },
        totalRisk: overdueRisk + bugRisk + covRisk + loadRisk,
      };
    }).sort((a, b) => b.totalRisk - a.totalRisk);
  }, [modules, state.items, state.testCases, today]);

  const riskLabel = (level) => ["양호", "주의", "경고", "위험"][level] || "양호";

  return (
    <div>
      <h2 className="tm-title" style={{ marginBottom: 16 }}><AlertTriangle size={18} /> 리스크 히트맵</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, fontSize: 11 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span className="heatmap-cell risk-0" style={{ width: 14, height: 14, borderRadius: 3, padding: 0 }} /> 양호</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span className="heatmap-cell risk-1" style={{ width: 14, height: 14, borderRadius: 3, padding: 0 }} /> 주의</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span className="heatmap-cell risk-2" style={{ width: 14, height: 14, borderRadius: 3, padding: 0 }} /> 경고</span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span className="heatmap-cell risk-3" style={{ width: 14, height: 14, borderRadius: 3, padding: 0 }} /> 위험</span>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead>
            <tr>
              <th>모듈</th>
              {RISK_FACTORS.map((rf) => <th key={rf.id} style={{ textAlign: "center" }}>{rf.label}</th>)}
              <th style={{ textAlign: "center" }}>종합</th>
            </tr>
          </thead>
          <tbody>
            {matrix.map((row) => (
              <tr key={row.module}>
                <td style={{ fontWeight: 600 }}>{row.module}</td>
                {RISK_FACTORS.map((rf) => (
                  <td key={rf.id} className={`heatmap-cell risk-${row.risks[rf.id]}`}>
                    {row.values[rf.id]} <span style={{ fontSize: 10, opacity: .7 }}>({riskLabel(row.risks[rf.id])})</span>
                  </td>
                ))}
                <td style={{ textAlign: "center" }}>
                  <span style={{
                    fontWeight: 700,
                    color: row.totalRisk >= 8 ? "#7F1D1D" : row.totalRisk >= 5 ? "#991B1B" : row.totalRisk >= 3 ? "#92400E" : "#065F46",
                    fontSize: 14,
                    fontFamily: "var(--mono)",
                  }}>
                    {row.totalRisk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
