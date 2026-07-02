import { useState, useEffect } from "react";
import { X, Plus, Trash2, GripVertical } from "lucide-react";
import { useStore } from "../../store/StoreContext";

export default function TestCaseForm({ testCase, onClose }) {
  const { state, dispatch } = useStore();
  const [f, setF] = useState(() => testCase || {
    title: "",
    folder: "",
    featureArea: state.featureAreas[0] || "",
    preconditions: "",
    steps: [{ order: 1, action: "", expected: "" }],
    linkedItemIds: [],
    tags: [],
  });
  const [tagInput, setTagInput] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const valid = f.title.trim().length > 0 && f.steps.some((s) => s.action.trim());

  const updateStep = (idx, key, val) => {
    const steps = f.steps.map((s, i) => (i === idx ? { ...s, [key]: val } : s));
    set("steps", steps);
  };
  const addStep = () => {
    set("steps", [...f.steps, { order: f.steps.length + 1, action: "", expected: "" }]);
  };
  const removeStep = (idx) => {
    const steps = f.steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 }));
    set("steps", steps.length ? steps : [{ order: 1, action: "", expected: "" }]);
  };

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !(f.tags || []).includes(t)) set("tags", [...(f.tags || []), t]);
    setTagInput("");
  };

  const toggleLink = (itemId) => {
    const ids = f.linkedItemIds || [];
    set("linkedItemIds", ids.includes(itemId) ? ids.filter((id) => id !== itemId) : [...ids, itemId]);
  };

  const save = () => {
    dispatch({ type: "UPSERT_TEST_CASE", testCase: { ...f, title: f.title.trim() } });
    onClose();
  };

  const remove = () => {
    if (testCase?.id) dispatch({ type: "REMOVE_TEST_CASE", id: testCase.id });
    onClose();
  };

  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" style={{ maxWidth: 640 }} onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <div className="modal-title">
            {testCase ? "테스트 케이스 편집" : "새 테스트 케이스"}
          </div>
          <button className="btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <label className="fld">
            <span>제목</span>
            <input autoFocus value={f.title} onChange={(e) => set("title", e.target.value)}
              placeholder="테스트 케이스 제목" />
          </label>

          <label className="fld">
            <span>폴더</span>
            <input value={f.folder || ""} onChange={(e) => set("folder", e.target.value)}
              placeholder="예: VIP 소개 / 히어로 영역 (비워두면 루트)" />
          </label>

          <div className="fld-row">
            <label className="fld">
              <span>기능 영역</span>
              <select value={f.featureArea} onChange={(e) => set("featureArea", e.target.value)}>
                {state.featureAreas.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </label>
          </div>

          <label className="fld">
            <span>사전 조건</span>
            <textarea value={f.preconditions} onChange={(e) => set("preconditions", e.target.value)}
              rows={2} placeholder="테스트 실행 전 필요한 조건" />
          </label>

          <div className="fld">
            <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--muted)" }}>테스트 스텝</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {f.steps.map((step, idx) => (
                <div key={idx} style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                  <span style={{ color: "var(--muted)", fontSize: 12, fontWeight: 600, minWidth: 20, paddingTop: 9, fontFamily: "var(--mono)" }}>
                    {step.order}
                  </span>
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                    <input value={step.action} onChange={(e) => updateStep(idx, "action", e.target.value)}
                      placeholder="수행 동작" style={{ border: "1px solid var(--line)", borderRadius: 7, padding: "7px 9px", fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                    <input value={step.expected} onChange={(e) => updateStep(idx, "expected", e.target.value)}
                      placeholder="기대 결과" style={{ border: "1px solid var(--line)", borderRadius: 7, padding: "7px 9px", fontSize: 13, fontFamily: "inherit", outline: "none", color: "var(--muted)" }} />
                  </div>
                  <button className="btn-ghost" onClick={() => removeStep(idx)} style={{ padding: 5, marginTop: 4 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <button className="btn-clear" onClick={addStep} style={{ alignSelf: "flex-start", marginTop: 4 }}>
              <Plus size={12} /> 스텝 추가
            </button>
          </div>

          <label className="fld">
            <span>태그</span>
            <div className="tag-edit">
              {(f.tags || []).map((t) => (
                <span key={t} className="tag rm" onClick={() => set("tags", f.tags.filter((x) => x !== t))}>
                  #{t} <X size={10} />
                </span>
              ))}
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => (e.key === "Enter" ? (e.preventDefault(), addTag()) : null)}
                placeholder="태그 입력 후 Enter" />
            </div>
          </label>

          <div className="fld">
            <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--muted)" }}>연결된 항목</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {state.items.filter((i) => ["test", "bug"].includes(i.type)).map((item) => (
                <button key={item.id} type="button"
                  className={`seg ${(f.linkedItemIds || []).includes(item.id) ? "on" : ""}`}
                  style={(f.linkedItemIds || []).includes(item.id) ? { borderColor: "var(--accent)", background: "rgba(74,69,201,.08)" } : {}}
                  onClick={() => toggleLink(item.id)}>
                  <span className="code">{item.code}</span> {item.title}
                </button>
              ))}
              {state.items.filter((i) => ["test", "bug"].includes(i.type)).length === 0 && (
                <span className="muted" style={{ fontSize: 12 }}>연결 가능한 항목이 없습니다</span>
              )}
            </div>
          </div>
        </div>

        <div className="modal-ft">
          {testCase?.id ? (
            <button className="btn-danger" onClick={remove}><Trash2 size={14} /> 삭제</button>
          ) : <span />}
          <div className="modal-ft-r">
            <button className="btn-ghost pad" onClick={onClose}>취소</button>
            <button className="btn-primary" disabled={!valid} onClick={save}>
              {testCase ? "저장" : "추가"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
