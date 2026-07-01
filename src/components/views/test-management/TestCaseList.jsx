import { useState, useMemo } from "react";
import { Plus, Search, FlaskConical, ChevronRight, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { useStore } from "../../../store/StoreContext";
import TestCaseForm from "../../forms/TestCaseForm";
import TestRunForm from "../../forms/TestRunForm";
import "./TestManagement.css";

export default function TestCaseList() {
  const { state } = useStore();
  const [editing, setEditing] = useState(null);
  const [runTarget, setRunTarget] = useState(null);
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState("");
  const [fArea, setFArea] = useState("all");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return state.testCases.filter((tc) => {
      if (fArea !== "all" && tc.featureArea !== fArea) return false;
      if (needle && !`${tc.title} ${(tc.tags || []).join(" ")}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [state.testCases, q, fArea]);

  const getLastRun = (tcId) => {
    const runs = state.testRuns.filter((r) => r.testCaseId === tcId);
    return runs.length ? runs[runs.length - 1] : null;
  };

  const getRunCount = (tcId) => state.testRuns.filter((r) => r.testCaseId === tcId).length;

  const resultIcon = (result) => {
    switch (result) {
      case "pass": return <CheckCircle2 size={14} style={{ color: "#10B981" }} />;
      case "fail": return <XCircle size={14} style={{ color: "#F43F5E" }} />;
      case "skip": return <MinusCircle size={14} style={{ color: "#94A3B8" }} />;
      case "blocked": return <MinusCircle size={14} style={{ color: "#F59E0B" }} />;
      default: return null;
    }
  };

  const detail = selected ? state.testCases.find((tc) => tc.id === selected) : null;
  const detailRuns = selected ? state.testRuns.filter((r) => r.testCaseId === selected).reverse() : [];

  return (
    <div className="tm-layout">
      <div className="tm-list">
        <div className="tm-list-hd">
          <h2 className="tm-title"><FlaskConical size={18} /> 테스트 케이스</h2>
          <button className="btn-primary" onClick={() => setEditing("new")}><Plus size={14} /> 추가</button>
        </div>

        <div className="tm-filters">
          <div className="search" style={{ flex: 1 }}>
            <Search size={14} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="검색..." />
          </div>
          <select value={fArea} onChange={(e) => setFArea(e.target.value)}
            style={{ height: 34, border: "1px solid var(--line)", borderRadius: 8, padding: "0 26px 0 10px", fontSize: 13,
              appearance: "none", background: "var(--surface)", fontFamily: "inherit" }}>
            <option value="all">전체 영역</option>
            {state.featureAreas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {filtered.length === 0 ? (
          <div className="tm-empty">
            <p className="muted">테스트 케이스가 없습니다.</p>
            <button className="btn-primary" onClick={() => setEditing("new")}><Plus size={14} /> 첫 테스트 케이스 추가</button>
          </div>
        ) : (
          <div className="tm-items">
            {filtered.map((tc) => {
              const last = getLastRun(tc.id);
              const count = getRunCount(tc.id);
              return (
                <div key={tc.id}
                  className={`tm-item ${selected === tc.id ? "active" : ""}`}
                  onClick={() => setSelected(tc.id)}>
                  <div className="tm-item-top">
                    <span className="tm-item-area">{tc.featureArea}</span>
                    {last && resultIcon(last.result)}
                  </div>
                  <div className="tm-item-title">{tc.title}</div>
                  <div className="tm-item-meta">
                    <span>{tc.steps.length}개 스텝</span>
                    <span>{count}회 실행</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="tm-detail">
        {detail ? (
          <>
            <div className="tm-detail-hd">
              <div>
                <span className="tm-item-area">{detail.featureArea}</span>
                <h3 style={{ margin: "6px 0 0", fontSize: 16, fontWeight: 600 }}>{detail.title}</h3>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn-clear" onClick={() => setRunTarget(detail.id)}>실행 기록</button>
                <button className="btn-ghost pad" onClick={() => setEditing(detail)}>편집</button>
              </div>
            </div>

            {detail.preconditions && (
              <div className="tm-section">
                <h4>사전 조건</h4>
                <p className="muted">{detail.preconditions}</p>
              </div>
            )}

            <div className="tm-section">
              <h4>테스트 스텝</h4>
              <table className="tm-steps-tbl">
                <thead>
                  <tr><th>#</th><th>수행 동작</th><th>기대 결과</th></tr>
                </thead>
                <tbody>
                  {detail.steps.map((s, i) => (
                    <tr key={i}>
                      <td className="mono" style={{ color: "var(--muted)", width: 30 }}>{s.order}</td>
                      <td>{s.action}</td>
                      <td style={{ color: "var(--muted)" }}>{s.expected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="tm-section">
              <h4>실행 이력 ({detailRuns.length})</h4>
              {detailRuns.length === 0 ? (
                <p className="muted" style={{ fontSize: 13 }}>아직 실행 기록이 없습니다.</p>
              ) : (
                <div className="tm-runs">
                  {detailRuns.map((run) => (
                    <div key={run.id} className="tm-run">
                      <div className="tm-run-result" data-result={run.result}>
                        {resultIcon(run.result)} {run.result.toUpperCase()}
                      </div>
                      <div className="tm-run-info">
                        <span>{run.executor}</span>
                        <span className="muted">{run.environment?.device || ""} · {run.environment?.os || ""}</span>
                        <span className="mono muted" style={{ fontSize: 11 }}>
                          {new Date(run.executedAt).toLocaleDateString("ko")}
                        </span>
                      </div>
                      {run.notes && <p className="muted" style={{ fontSize: 12, margin: "4px 0 0" }}>{run.notes}</p>}
                      {run.screenshots?.length > 0 && (
                        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                          {run.screenshots.map((src, i) => (
                            <img key={i} src={src} alt="" style={{ width: 80, height: 56, objectFit: "cover", borderRadius: 4, border: "1px solid var(--line)" }} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="tm-detail-empty">
            <FlaskConical size={32} style={{ color: "var(--muted)", opacity: .4 }} />
            <p className="muted">테스트 케이스를 선택하세요</p>
          </div>
        )}
      </div>

      {editing && (
        <TestCaseForm
          testCase={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
      {runTarget && (
        <TestRunForm testCaseId={runTarget} onClose={() => setRunTarget(null)} />
      )}
    </div>
  );
}
