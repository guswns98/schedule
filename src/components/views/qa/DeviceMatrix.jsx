import { useMemo } from "react";
import { Smartphone, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { useStore } from "../../../store/StoreContext";
import "./QA.css";

export default function DeviceMatrix() {
  const { state } = useStore();
  const envs = state.environments || [];

  const matrix = useMemo(() => {
    return state.testCases.map((tc) => {
      const cells = envs.map((env) => {
        const runs = state.testRuns.filter(
          (r) => r.testCaseId === tc.id &&
            r.environment?.os === env.os &&
            r.environment?.browser === env.browser &&
            r.environment?.device === env.device
        );
        if (runs.length === 0) return { result: "none" };
        return { result: runs[runs.length - 1].result };
      });
      return { tc, cells };
    });
  }, [state.testCases, state.testRuns, envs]);

  const resultLabel = (r) => {
    switch (r) {
      case "pass": return <CheckCircle2 size={14} style={{ color: "#10B981" }} />;
      case "fail": return <XCircle size={14} style={{ color: "#F43F5E" }} />;
      case "skip": return <MinusCircle size={14} style={{ color: "#F59E0B" }} />;
      default: return <span className="muted">—</span>;
    }
  };

  return (
    <div>
      <h2 className="tm-title" style={{ marginBottom: 16 }}><Smartphone size={18} /> 디바이스 매트릭스</h2>

      {state.testCases.length === 0 ? (
        <div className="tm-empty"><p className="muted">테스트 케이스를 먼저 추가하세요.</p></div>
      ) : envs.length === 0 ? (
        <div className="tm-empty"><p className="muted">환경 설정이 없습니다.</p></div>
      ) : (
        <div className="tbl-wrap">
          <table className="tbl" style={{ fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ position: "sticky", left: 0, zIndex: 2 }}>테스트 케이스</th>
                {envs.map((e) => (
                  <th key={e.id} style={{ textAlign: "center", minWidth: 110 }}>
                    <div>{e.device}</div>
                    <div style={{ fontWeight: 400, fontSize: 10, opacity: .7 }}>{e.os} · {e.browser}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map(({ tc, cells }) => (
                <tr key={tc.id}>
                  <td style={{ fontWeight: 500, position: "sticky", left: 0, background: "var(--surface)", zIndex: 1 }}>
                    <span className="tm-item-area" style={{ marginRight: 6 }}>{tc.featureArea}</span>
                    {tc.title}
                  </td>
                  {cells.map((cell, i) => (
                    <td key={i} className={`dm-cell ${cell.result}`} style={{ textAlign: "center", borderBottom: "1px solid var(--line2)" }}>
                      {resultLabel(cell.result)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
