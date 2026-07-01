import { useState } from "react";
import { Bug, Plus, Trash2 } from "lucide-react";
import { useStore } from "../../../store/StoreContext";
import "./QA.css";

export default function BugReproTracker() {
  const { state, dispatch } = useStore();
  const [selected, setSelected] = useState(null);
  const bugs = state.items.filter((i) => i.type === "bug" && i.status !== "done");

  const repro = selected ? (state.bugReproData[selected] || { totalAttempts: 0, reproduced: 0, rate: 0, conditions: [] }) : null;

  const addAttempt = (reproduced) => {
    if (!selected) return;
    const prev = state.bugReproData[selected] || { totalAttempts: 0, reproduced: 0, rate: 0, conditions: [] };
    const total = prev.totalAttempts + 1;
    const reprod = prev.reproduced + (reproduced ? 1 : 0);
    dispatch({
      type: "UPDATE_BUG_REPRO",
      itemId: selected,
      data: { ...prev, totalAttempts: total, reproduced: reprod, rate: Math.round((reprod / total) * 100) / 100 },
    });
  };

  const addCondition = (env, reproduced, notes) => {
    if (!selected) return;
    const prev = state.bugReproData[selected] || { totalAttempts: 0, reproduced: 0, rate: 0, conditions: [] };
    dispatch({
      type: "UPDATE_BUG_REPRO",
      itemId: selected,
      data: { ...prev, conditions: [...prev.conditions, { env, reproduced, notes, timestamp: Date.now() }] },
    });
  };

  const [condForm, setCondForm] = useState({ env: "", notes: "", reproduced: true });

  const selectedBug = selected ? state.items.find((i) => i.id === selected) : null;

  return (
    <div className="qa-layout">
      <div className="qa-list">
        <div className="tm-list-hd">
          <h2 className="tm-title"><Bug size={18} /> 재현율 추적</h2>
        </div>
        {bugs.length === 0 ? (
          <div className="tm-empty"><p className="muted">활성 버그가 없습니다.</p></div>
        ) : (
          <div className="tm-items">
            {bugs.map((bug) => {
              const rd = state.bugReproData[bug.id];
              return (
                <div key={bug.id}
                  className={`tm-item ${selected === bug.id ? "active" : ""}`}
                  onClick={() => setSelected(bug.id)}>
                  <div className="tm-item-top">
                    <span className="code">{bug.code}</span>
                    {rd && (
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "var(--mono)",
                        color: rd.rate > 0.7 ? "#F43F5E" : rd.rate > 0.3 ? "#F59E0B" : "#10B981" }}>
                        {Math.round(rd.rate * 100)}%
                      </span>
                    )}
                  </div>
                  <div className="tm-item-title">{bug.title}</div>
                  <div className="tm-item-meta">
                    <span>{bug.assignee}</span>
                    {rd && <span>{rd.totalAttempts}회 시도</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="qa-detail">
        {selectedBug && repro ? (
          <>
            <div className="tm-detail-hd">
              <div>
                <span className="code">{selectedBug.code}</span>
                <h3 style={{ margin: "6px 0 0", fontSize: 16, fontWeight: 600 }}>{selectedBug.title}</h3>
              </div>
            </div>

            <div className="repro-stats">
              <div className="repro-stat">
                <div className="repro-stat-val" style={{ color: repro.rate > 0.7 ? "#F43F5E" : repro.rate > 0.3 ? "#F59E0B" : "#10B981" }}>
                  {Math.round(repro.rate * 100)}%
                </div>
                <div className="repro-stat-label">재현율</div>
              </div>
              <div className="repro-stat">
                <div className="repro-stat-val">{repro.totalAttempts}</div>
                <div className="repro-stat-label">총 시도</div>
              </div>
              <div className="repro-stat">
                <div className="repro-stat-val" style={{ color: "#F43F5E" }}>{repro.reproduced}</div>
                <div className="repro-stat-label">재현 성공</div>
              </div>
            </div>

            <div className="tm-section">
              <h4>재현 시도 기록</h4>
              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                <button className="btn-primary" onClick={() => addAttempt(true)} style={{ background: "#F43F5E" }}>
                  재현됨
                </button>
                <button className="btn-clear" onClick={() => addAttempt(false)}>
                  미재현
                </button>
              </div>
            </div>

            <div className="tm-section">
              <h4>재현 조건 ({repro.conditions.length})</h4>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input value={condForm.env} onChange={(e) => setCondForm((p) => ({ ...p, env: e.target.value }))}
                  placeholder="환경 (예: Chrome/Mac)" style={{ border: "1px solid var(--line)", borderRadius: 7, padding: "7px 9px", fontSize: 13, flex: 1, fontFamily: "inherit" }} />
                <input value={condForm.notes} onChange={(e) => setCondForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="메모" style={{ border: "1px solid var(--line)", borderRadius: 7, padding: "7px 9px", fontSize: 13, flex: 1, fontFamily: "inherit" }} />
                <button className="btn-clear" onClick={() => {
                  if (condForm.env.trim()) {
                    addCondition(condForm.env, condForm.reproduced, condForm.notes);
                    setCondForm({ env: "", notes: "", reproduced: true });
                  }
                }}><Plus size={12} /> 추가</button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {repro.conditions.map((c, i) => (
                  <div key={i} className="rs-case">
                    <span style={{ color: c.reproduced ? "#F43F5E" : "#10B981", fontWeight: 600, fontSize: 11 }}>
                      {c.reproduced ? "재현" : "미재현"}
                    </span>
                    <span style={{ fontWeight: 500 }}>{c.env}</span>
                    {c.notes && <span className="muted">{c.notes}</span>}
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="tm-detail-empty">
            <Bug size={32} style={{ color: "var(--muted)", opacity: .4 }} />
            <p className="muted">버그를 선택하세요</p>
          </div>
        )}
      </div>
    </div>
  );
}
