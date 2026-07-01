import { useMemo } from "react";
import { Grid3X3, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { useStore } from "../../../store/StoreContext";
import "./TestManagement.css";

export default function TestCoverageMatrix() {
  const { state } = useStore();

  const matrix = useMemo(() => {
    return state.featureAreas.map((area) => {
      const cases = state.testCases.filter((tc) => tc.featureArea === area);
      const total = cases.length;
      let pass = 0, fail = 0, noRun = 0;

      cases.forEach((tc) => {
        const runs = state.testRuns.filter((r) => r.testCaseId === tc.id);
        if (runs.length === 0) { noRun++; return; }
        const last = runs[runs.length - 1];
        if (last.result === "pass") pass++;
        else fail++;
      });

      return { area, total, pass, fail, noRun, coverage: total > 0 ? Math.round(((total - noRun) / total) * 100) : 0 };
    });
  }, [state.featureAreas, state.testCases, state.testRuns]);

  const totals = useMemo(() => {
    const t = { total: 0, pass: 0, fail: 0, noRun: 0 };
    matrix.forEach((r) => { t.total += r.total; t.pass += r.pass; t.fail += r.fail; t.noRun += r.noRun; });
    t.coverage = t.total > 0 ? Math.round(((t.total - t.noRun) / t.total) * 100) : 0;
    return t;
  }, [matrix]);

  const barColor = (pct) => pct >= 80 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#F43F5E";

  return (
    <div>
      <h2 className="tm-title" style={{ marginBottom: 16 }}><Grid3X3 size={18} /> 커버리지 매트릭스</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 24 }}>
        <div className="rs-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: barColor(totals.coverage) }}>{totals.coverage}%</div>
          <div className="muted" style={{ fontSize: 12 }}>전체 커버리지</div>
        </div>
        <div className="rs-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{totals.total}</div>
          <div className="muted" style={{ fontSize: 12 }}>전체 테스트 케이스</div>
        </div>
        <div className="rs-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#10B981" }}>{totals.pass}</div>
          <div className="muted" style={{ fontSize: 12 }}>Pass</div>
        </div>
        <div className="rs-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#F43F5E" }}>{totals.fail}</div>
          <div className="muted" style={{ fontSize: 12 }}>Fail</div>
        </div>
      </div>

      {matrix.length === 0 ? (
        <div className="tm-empty">
          <p className="muted">기능 영역이 없습니다.</p>
        </div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>기능 영역</th>
                <th>테스트 수</th>
                <th>Pass</th>
                <th>Fail</th>
                <th>미실행</th>
                <th>커버리지</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.area}>
                  <td style={{ fontWeight: 600 }}>{row.area}</td>
                  <td>{row.total}</td>
                  <td>
                    {row.pass > 0 && <span style={{ color: "#10B981", fontWeight: 600 }}><CheckCircle2 size={12} style={{ verticalAlign: -2 }} /> {row.pass}</span>}
                    {row.pass === 0 && <span className="muted">0</span>}
                  </td>
                  <td>
                    {row.fail > 0 && <span style={{ color: "#F43F5E", fontWeight: 600 }}><XCircle size={12} style={{ verticalAlign: -2 }} /> {row.fail}</span>}
                    {row.fail === 0 && <span className="muted">0</span>}
                  </td>
                  <td>
                    {row.noRun > 0 && <span className="muted">{row.noRun}</span>}
                    {row.noRun === 0 && <span className="muted">0</span>}
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 6, background: "var(--line2)", borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${row.coverage}%`, height: "100%", background: barColor(row.coverage), borderRadius: 3 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, fontFamily: "var(--mono)", color: barColor(row.coverage), minWidth: 36 }}>
                        {row.coverage}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
