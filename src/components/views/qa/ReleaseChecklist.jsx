import { useState } from "react";
import { ClipboardCheck, Plus, Trash2, X } from "lucide-react";
import { useStore } from "../../../store/StoreContext";
import { genId } from "../../../utils/id";
import { todayISO } from "../../../utils/date";
import "./QA.css";

export default function ReleaseChecklist() {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", targetDate: "", qaStartDate: "", deployDate: "", status: "planned" });
  const [newItem, setNewItem] = useState("");

  const startNew = () => {
    setEditing("new");
    setForm({ name: "", targetDate: todayISO(), qaStartDate: todayISO(), deployDate: todayISO(), status: "planned" });
  };

  const startEdit = (rel) => {
    setEditing(rel.id);
    setForm({ name: rel.name, targetDate: rel.targetDate, qaStartDate: rel.qaStartDate, deployDate: rel.deployDate, status: rel.status });
  };

  const save = () => {
    if (!form.name.trim()) return;
    const release = {
      ...(editing !== "new" ? { id: editing, checklist: state.releases.find((r) => r.id === editing)?.checklist || [] } : { checklist: [] }),
      ...form,
      name: form.name.trim(),
    };
    dispatch({ type: "UPSERT_RELEASE", release });
    setEditing(null);
  };

  const toggleCheck = (relId, checkId) => {
    const rel = state.releases.find((r) => r.id === relId);
    if (!rel) return;
    const checklist = rel.checklist.map((c) => (c.id === checkId ? { ...c, checked: !c.checked } : c));
    dispatch({ type: "UPSERT_RELEASE", release: { ...rel, checklist } });
  };

  const addCheckItem = (relId) => {
    if (!newItem.trim()) return;
    const rel = state.releases.find((r) => r.id === relId);
    if (!rel) return;
    const item = { id: genId(), label: newItem.trim(), checked: false, assignee: "" };
    dispatch({ type: "UPSERT_RELEASE", release: { ...rel, checklist: [...rel.checklist, item] } });
    setNewItem("");
  };

  const removeCheckItem = (relId, checkId) => {
    const rel = state.releases.find((r) => r.id === relId);
    if (!rel) return;
    dispatch({ type: "UPSERT_RELEASE", release: { ...rel, checklist: rel.checklist.filter((c) => c.id !== checkId) } });
  };

  const applyTemplate = (relId, tplId) => {
    const rel = state.releases.find((r) => r.id === relId);
    const tpl = state.checklistTemplates.find((t) => t.id === tplId);
    if (!rel || !tpl) return;
    const newItems = tpl.items.map((item) => ({ id: genId(), label: item.label, checked: false, assignee: "" }));
    dispatch({ type: "UPSERT_RELEASE", release: { ...rel, checklist: [...rel.checklist, ...newItems] } });
  };

  const statusColors = { planned: "#94A3B8", qa: "#F59E0B", staging: "#8B5CF6", released: "#10B981" };
  const statusLabels = { planned: "계획", qa: "QA 진행", staging: "스테이징", released: "릴리스 완료" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="tm-title"><ClipboardCheck size={18} /> 릴리스 체크리스트</h2>
        <button className="btn-primary" onClick={startNew}><Plus size={14} /> 새 릴리스</button>
      </div>

      {editing && (
        <div className="rs-card" style={{ borderColor: "var(--accent)", marginBottom: 16 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="fld-row">
              <label className="fld">
                <span>릴리스 이름</span>
                <input autoFocus value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="v2.5" />
              </label>
              <label className="fld">
                <span>상태</span>
                <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}>
                  {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
            </div>
            <div className="fld-row">
              <label className="fld"><span>QA 시작</span><input type="date" value={form.qaStartDate} onChange={(e) => setForm((p) => ({ ...p, qaStartDate: e.target.value }))} /></label>
              <label className="fld"><span>목표일</span><input type="date" value={form.targetDate} onChange={(e) => setForm((p) => ({ ...p, targetDate: e.target.value }))} /></label>
              <label className="fld"><span>배포일</span><input type="date" value={form.deployDate} onChange={(e) => setForm((p) => ({ ...p, deployDate: e.target.value }))} /></label>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn-ghost pad" onClick={() => setEditing(null)}>취소</button>
              <button className="btn-primary" disabled={!form.name.trim()} onClick={save}>저장</button>
            </div>
          </div>
        </div>
      )}

      {state.releases.length === 0 && !editing ? (
        <div className="tm-empty">
          <p className="muted">릴리스가 없습니다.</p>
          <button className="btn-primary" onClick={startNew}><Plus size={14} /> 첫 릴리스 만들기</button>
        </div>
      ) : (
        state.releases.map((rel) => {
          const total = rel.checklist.length;
          const checked = rel.checklist.filter((c) => c.checked).length;
          const pct = total > 0 ? Math.round((checked / total) * 100) : 0;

          return (
            <div key={rel.id} className="rs-card">
              <div className="rs-hd">
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="rs-name">{rel.name}</span>
                    <span className="sbadge" style={{ color: statusColors[rel.status], background: statusColors[rel.status] + "1c" }}>
                      {statusLabels[rel.status]}
                    </span>
                  </div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                    QA: {rel.qaStartDate} → 목표: {rel.targetDate} → 배포: {rel.deployDate}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn-ghost pad" onClick={() => startEdit(rel)}>편집</button>
                  <button className="btn-ghost" onClick={() => dispatch({ type: "REMOVE_RELEASE", id: rel.id })}><Trash2 size={14} /></button>
                </div>
              </div>

              <div className="rc-progress">
                <div className="rc-progress-bar" style={{ width: `${pct}%`, background: pct === 100 ? "#10B981" : "var(--accent)" }} />
              </div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{checked}/{total} 완료 ({pct}%)</div>

              {rel.checklist.map((item) => (
                <div key={item.id} className="rc-item">
                  <label className={item.checked ? "checked" : ""}>
                    <input type="checkbox" checked={item.checked} onChange={() => toggleCheck(rel.id, item.id)} />
                    {item.label}
                  </label>
                  <button className="btn-ghost" style={{ padding: 3 }} onClick={() => removeCheckItem(rel.id, item.id)}>
                    <X size={12} />
                  </button>
                </div>
              ))}

              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input value={newItem} onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCheckItem(rel.id)}
                  placeholder="체크리스트 항목 추가..." style={{ border: "1px solid var(--line)", borderRadius: 7, padding: "6px 9px", fontSize: 12, flex: 1, fontFamily: "inherit" }} />
                <button className="btn-clear" onClick={() => addCheckItem(rel.id)} style={{ fontSize: 11 }}><Plus size={12} /></button>
                {state.checklistTemplates.length > 0 && (
                  <select onChange={(e) => { if (e.target.value) applyTemplate(rel.id, e.target.value); e.target.value = ""; }}
                    style={{ border: "1px solid var(--line)", borderRadius: 7, padding: "0 8px", fontSize: 11, appearance: "none", background: "var(--surface)" }}>
                    <option value="">템플릿 적용</option>
                    {state.checklistTemplates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
