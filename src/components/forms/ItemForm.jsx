import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { TYPES, STATUSES, PRIORITIES } from "../../constants/types";
import { todayISO } from "../../utils/date";

export default function ItemForm({ item, onSave, onDelete, onClose }) {
  const [f, setF] = useState(() => item || {
    type: "task", title: "", status: "todo", priority: "medium",
    assignee: "", startDate: todayISO(), dueDate: todayISO(),
    tags: [], description: "", module: "", sprint: "",
  });
  const [tagInput, setTagInput] = useState("");
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const valid = f.title.trim().length > 0;

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, "");
    if (t && !(f.tags || []).includes(t)) set("tags", [...(f.tags || []), t]);
    setTagInput("");
  };

  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <div className="modal-title">
            {item ? <span className="code">{item.code}</span> : "새 항목"}
            {item ? <span className="modal-editing">편집</span> : null}
          </div>
          <button className="btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <label className="fld">
            <span>제목</span>
            <input autoFocus value={f.title} onChange={(e) => set("title", e.target.value)}
              placeholder="무엇을 하나요?" />
          </label>

          <div className="fld-row">
            <label className="fld">
              <span>유형</span>
              <div className="segset">
                {Object.entries(TYPES).map(([k, v]) => (
                  <button key={k} type="button"
                    className={`seg ${f.type === k ? "on" : ""}`}
                    style={f.type === k ? { color: v.color, borderColor: v.color, background: v.color + "14" } : {}}
                    onClick={() => set("type", k)}>
                    <v.Icon size={13} /> {v.label}
                  </button>
                ))}
              </div>
            </label>
          </div>

          <div className="fld-row">
            <label className="fld">
              <span>상태</span>
              <select value={f.status} onChange={(e) => set("status", e.target.value)}>
                {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </label>
            <label className="fld">
              <span>우선순위</span>
              <select value={f.priority} onChange={(e) => set("priority", e.target.value)}>
                {Object.entries(PRIORITIES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </label>
            <label className="fld">
              <span>담당자</span>
              <input value={f.assignee} onChange={(e) => set("assignee", e.target.value)} placeholder="이름" />
            </label>
          </div>

          <div className="fld-row">
            <label className="fld">
              <span>시작일</span>
              <input type="date" value={f.startDate || ""} onChange={(e) => set("startDate", e.target.value)} />
            </label>
            <label className="fld">
              <span>마감일</span>
              <input type="date" value={f.dueDate || ""} onChange={(e) => set("dueDate", e.target.value)} />
            </label>
          </div>

          <div className="fld-row">
            <label className="fld">
              <span>모듈</span>
              <input value={f.module || ""} onChange={(e) => set("module", e.target.value)} placeholder="예: 결제, 인증" />
            </label>
            <label className="fld">
              <span>스프린트</span>
              <input value={f.sprint || ""} onChange={(e) => set("sprint", e.target.value)} placeholder="예: Sprint 12" />
            </label>
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

          <label className="fld">
            <span>설명</span>
            <textarea value={f.description} onChange={(e) => set("description", e.target.value)}
              rows={3} placeholder="재현 절차, 완료 조건 등" />
          </label>
        </div>

        <div className="modal-ft">
          {item ? (
            <button className="btn-danger" onClick={() => onDelete(item.id)}><Trash2 size={14} /> 삭제</button>
          ) : <span />}
          <div className="modal-ft-r">
            <button className="btn-ghost pad" onClick={onClose}>취소</button>
            <button className="btn-primary" disabled={!valid} onClick={() => onSave({ ...f, title: f.title.trim() })}>
              {item ? "저장" : "추가"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
