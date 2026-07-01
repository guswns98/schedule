import { useState } from "react";
import { Plus, Layers, Trash2, CheckCircle2, XCircle, MinusCircle, X } from "lucide-react";
import { useStore } from "../../../store/StoreContext";
import "./TestManagement.css";

export default function RegressionSets() {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [selectedCases, setSelectedCases] = useState([]);

  const startNew = () => {
    setEditing("new");
    setName("");
    setSelectedCases([]);
  };

  const startEdit = (rs) => {
    setEditing(rs.id);
    setName(rs.name);
    setSelectedCases([...rs.testCaseIds]);
  };

  const toggleCase = (id) => {
    setSelectedCases((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const save = () => {
    if (!name.trim()) return;
    const set = {
      ...(editing !== "new" ? { id: editing } : {}),
      name: name.trim(),
      testCaseIds: selectedCases,
      releaseId: null,
    };
    dispatch({ type: "UPSERT_REGRESSION_SET", set });
    setEditing(null);
  };

  const remove = (id) => {
    dispatch({ type: "REMOVE_REGRESSION_SET", id });
    if (editing === id) setEditing(null);
  };

  const getLastResult = (tcId) => {
    const runs = state.testRuns.filter((r) => r.testCaseId === tcId);
    return runs.length ? runs[runs.length - 1].result : null;
  };

  const resultIcon = (result) => {
    if (!result) return <MinusCircle size={13} style={{ color: "var(--muted)" }} />;
    switch (result) {
      case "pass": return <CheckCircle2 size={13} style={{ color: "#10B981" }} />;
      case "fail": return <XCircle size={13} style={{ color: "#F43F5E" }} />;
      default: return <MinusCircle size={13} style={{ color: "#F59E0B" }} />;
    }
  };

  const getPassRate = (caseIds) => {
    if (!caseIds.length) return null;
    let pass = 0;
    caseIds.forEach((id) => {
      if (getLastResult(id) === "pass") pass++;
    });
    return Math.round((pass / caseIds.length) * 100);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="tm-title"><Layers size={18} /> 회귀 테스트 세트</h2>
        <button className="btn-primary" onClick={startNew}><Plus size={14} /> 새 세트</button>
      </div>

      {editing && (
        <div className="rs-card" style={{ borderColor: "var(--accent)", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="세트 이름"
              autoFocus className="fld"
              style={{ border: "1px solid var(--line)", borderRadius: 8, padding: "8px 10px", fontSize: 14, fontFamily: "inherit", flex: 1 }} />
            <button className="btn-primary" disabled={!name.trim()} onClick={save}>저장</button>
            <button className="btn-ghost" onClick={() => setEditing(null)}><X size={16} /></button>
          </div>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>
            테스트 케이스 선택 ({selectedCases.length}개)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
            {state.testCases.length === 0 ? (
              <p className="muted" style={{ fontSize: 12 }}>먼저 테스트 케이스를 추가하세요.</p>
            ) : (
              state.testCases.map((tc) => (
                <label key={tc.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px",
                  background: selectedCases.includes(tc.id) ? "rgba(74,69,201,.06)" : "var(--bg)",
                  borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
                  <input type="checkbox" checked={selectedCases.includes(tc.id)}
                    onChange={() => toggleCase(tc.id)} />
                  <span className="tm-item-area">{tc.featureArea}</span>
                  {tc.title}
                </label>
              ))
            )}
          </div>
        </div>
      )}

      {state.regressionSets.length === 0 && !editing ? (
        <div className="tm-empty">
          <p className="muted">회귀 테스트 세트가 없습니다.</p>
          <button className="btn-primary" onClick={startNew}><Plus size={14} /> 첫 세트 만들기</button>
        </div>
      ) : (
        state.regressionSets.map((rs) => {
          const rate = getPassRate(rs.testCaseIds);
          return (
            <div key={rs.id} className="rs-card">
              <div className="rs-hd">
                <div>
                  <div className="rs-name">{rs.name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {rs.testCaseIds.length}개 케이스
                    {rate !== null && <> · Pass rate: <span style={{ fontWeight: 600, color: rate >= 80 ? "#10B981" : rate >= 50 ? "#F59E0B" : "#F43F5E" }}>{rate}%</span></>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn-ghost pad" onClick={() => startEdit(rs)}>편집</button>
                  <button className="btn-ghost" onClick={() => remove(rs.id)}><Trash2 size={14} /></button>
                </div>
              </div>
              {rs.testCaseIds.length > 0 && (
                <div className="rs-cases">
                  {rs.testCaseIds.map((id) => {
                    const tc = state.testCases.find((t) => t.id === id);
                    if (!tc) return null;
                    const result = getLastResult(id);
                    return (
                      <div key={id} className="rs-case">
                        {resultIcon(result)}
                        <span className="tm-item-area">{tc.featureArea}</span>
                        <span style={{ fontWeight: 500 }}>{tc.title}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
