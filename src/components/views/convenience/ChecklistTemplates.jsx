import { useState } from "react";
import { ClipboardList, Plus, Trash2, X, GripVertical } from "lucide-react";
import { useStore } from "../../../store/StoreContext";

export default function ChecklistTemplates() {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [items, setItems] = useState([]);
  const [newLabel, setNewLabel] = useState("");

  const startNew = () => {
    setEditing("new");
    setName("");
    setItems([]);
  };

  const startEdit = (tpl) => {
    setEditing(tpl.id);
    setName(tpl.name);
    setItems([...tpl.items]);
  };

  const addItem = () => {
    if (!newLabel.trim()) return;
    setItems((prev) => [...prev, { label: newLabel.trim(), required: false }]);
    setNewLabel("");
  };

  const removeItem = (idx) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const toggleRequired = (idx) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, required: !item.required } : item)));
  };

  const save = () => {
    if (!name.trim() || items.length === 0) return;
    const template = {
      ...(editing !== "new" ? { id: editing } : {}),
      name: name.trim(),
      items,
    };
    dispatch({ type: "UPSERT_TEMPLATE", template });
    setEditing(null);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="tm-title"><ClipboardList size={18} /> 체크리스트 템플릿</h2>
        <button className="btn-primary" onClick={startNew}><Plus size={14} /> 새 템플릿</button>
      </div>

      {editing && (
        <div className="rs-card" style={{ borderColor: "var(--accent)", marginBottom: 16 }}>
          <label className="fld" style={{ marginBottom: 12 }}>
            <span>템플릿 이름</span>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="릴리스 전 QA 체크리스트" />
          </label>

          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--muted)", marginBottom: 8 }}>
            항목 ({items.length})
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
            {items.map((item, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", background: "var(--bg)", borderRadius: 6 }}>
                <span style={{ flex: 1, fontSize: 13 }}>{item.label}</span>
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted)", cursor: "pointer" }}>
                  <input type="checkbox" checked={item.required} onChange={() => toggleRequired(idx)} />
                  필수
                </label>
                <button className="btn-ghost" style={{ padding: 3 }} onClick={() => removeItem(idx)}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              placeholder="항목 추가..." style={{ border: "1px solid var(--line)", borderRadius: 7, padding: "6px 9px", fontSize: 12, flex: 1, fontFamily: "inherit" }} />
            <button className="btn-clear" onClick={addItem}><Plus size={12} /></button>
          </div>

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
            <button className="btn-ghost pad" onClick={() => setEditing(null)}>취소</button>
            <button className="btn-primary" disabled={!name.trim() || items.length === 0} onClick={save}>저장</button>
          </div>
        </div>
      )}

      {state.checklistTemplates.length === 0 && !editing ? (
        <div className="tm-empty" style={{ minHeight: 200 }}>
          <p className="muted">체크리스트 템플릿이 없습니다.</p>
          <button className="btn-primary" onClick={startNew}><Plus size={14} /> 첫 템플릿 만들기</button>
        </div>
      ) : (
        state.checklistTemplates.map((tpl) => (
          <div key={tpl.id} className="rs-card">
            <div className="rs-hd">
              <div>
                <div className="rs-name">{tpl.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>{tpl.items.length}개 항목</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn-ghost pad" onClick={() => startEdit(tpl)}>편집</button>
                <button className="btn-ghost" onClick={() => dispatch({ type: "REMOVE_TEMPLATE", id: tpl.id })}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
              {tpl.items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 10px", background: "var(--bg)", borderRadius: 6, fontSize: 13 }}>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {item.required && <span style={{ fontSize: 10, color: "#F43F5E", fontWeight: 600 }}>필수</span>}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
