import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useStore } from "../../store/StoreContext";

const RESULTS = [
  { value: "pass",    label: "Pass",    color: "#10B981" },
  { value: "fail",    label: "Fail",    color: "#F43F5E" },
  { value: "skip",    label: "Skip",    color: "#94A3B8" },
  { value: "blocked", label: "Blocked", color: "#F59E0B" },
];

export default function TestRunForm({ testCaseId, onClose }) {
  const { state, dispatch } = useStore();
  const [f, setF] = useState({
    testCaseId,
    result: "pass",
    executor: state.members[0] || "",
    environment: { os: "", browser: "", device: "" },
    notes: "",
    screenshots: [],
    bugItemId: null,
  });
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const setEnv = (k, v) => setF((p) => ({ ...p, environment: { ...p.environment, [k]: v } }));

  const handleScreenshot = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      // Compress by drawing to canvas
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 800;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL("image/jpeg", 0.6);
        set("screenshots", [...f.screenshots, compressed]);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const removeScreenshot = (idx) => {
    set("screenshots", f.screenshots.filter((_, i) => i !== idx));
  };

  const save = () => {
    dispatch({ type: "ADD_TEST_RUN", testRun: f });
    onClose();
  };

  useEffect(() => {
    const h = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const envPresets = state.environments || [];

  return (
    <div className="overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-hd">
          <div className="modal-title">테스트 실행 기록</div>
          <button className="btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="fld">
            <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--muted)" }}>결과</span>
            <div className="segset">
              {RESULTS.map((r) => (
                <button key={r.value} type="button"
                  className={`seg ${f.result === r.value ? "on" : ""}`}
                  style={f.result === r.value ? { color: r.color, borderColor: r.color, background: r.color + "14" } : {}}
                  onClick={() => set("result", r.value)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <label className="fld">
            <span>실행자</span>
            <select value={f.executor} onChange={(e) => set("executor", e.target.value)}>
              {state.members.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>

          <div className="fld">
            <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--muted)" }}>환경</span>
            {envPresets.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
                {envPresets.map((ep) => (
                  <button key={ep.id} type="button" className="btn-clear" style={{ fontSize: 11 }}
                    onClick={() => setF((p) => ({ ...p, environment: { os: ep.os, browser: ep.browser, device: ep.device } }))}>
                    {ep.device} · {ep.os}
                  </button>
                ))}
              </div>
            )}
            <div className="fld-row">
              <label className="fld">
                <input value={f.environment.os} onChange={(e) => setEnv("os", e.target.value)} placeholder="OS" />
              </label>
              <label className="fld">
                <input value={f.environment.browser} onChange={(e) => setEnv("browser", e.target.value)} placeholder="브라우저" />
              </label>
              <label className="fld">
                <input value={f.environment.device} onChange={(e) => setEnv("device", e.target.value)} placeholder="디바이스" />
              </label>
            </div>
          </div>

          <label className="fld">
            <span>메모</span>
            <textarea value={f.notes} onChange={(e) => set("notes", e.target.value)}
              rows={2} placeholder="실패 원인, 특이사항 등" />
          </label>

          <div className="fld">
            <span style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--muted)" }}>스크린샷</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {f.screenshots.map((src, idx) => (
                <div key={idx} style={{ position: "relative" }}>
                  <img src={src} alt="" style={{ width: 100, height: 70, objectFit: "cover", borderRadius: 6, border: "1px solid var(--line)" }} />
                  <button className="btn-ghost" onClick={() => removeScreenshot(idx)}
                    style={{ position: "absolute", top: -6, right: -6, padding: 2, background: "var(--surface)", borderRadius: "50%", border: "1px solid var(--line)" }}>
                    <X size={10} />
                  </button>
                </div>
              ))}
              <label style={{ width: 100, height: 70, border: "1px dashed var(--line)", borderRadius: 6,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 11, color: "var(--muted)" }}>
                + 추가
                <input type="file" accept="image/*" onChange={handleScreenshot} style={{ display: "none" }} />
              </label>
            </div>
          </div>

          {f.result === "fail" && (
            <label className="fld">
              <span>연결 버그</span>
              <select value={f.bugItemId || ""} onChange={(e) => set("bugItemId", e.target.value || null)}>
                <option value="">없음</option>
                {state.items.filter((i) => i.type === "bug").map((b) => (
                  <option key={b.id} value={b.id}>{b.code} - {b.title}</option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="modal-ft">
          <span />
          <div className="modal-ft-r">
            <button className="btn-ghost pad" onClick={onClose}>취소</button>
            <button className="btn-primary" onClick={save}>기록</button>
          </div>
        </div>
      </div>
    </div>
  );
}
