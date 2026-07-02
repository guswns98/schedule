import { useState, useMemo, useRef } from "react";
import { Plus, Search, FlaskConical, ChevronRight, CheckCircle2, XCircle, MinusCircle, Upload } from "lucide-react";
import { read, utils } from "xlsx";
import { useStore } from "../../../store/StoreContext";
import TestCaseForm from "../../forms/TestCaseForm";
import TestRunForm from "../../forms/TestRunForm";
import "./TestManagement.css";

function parseExcel(buffer) {
  const wb = read(buffer, { type: "array" });
  // 두 번째 시트 (TC 데이터), 없으면 첫 번째 시트
  const sheetName = wb.SheetNames[1] || wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const rows = utils.sheet_to_json(ws, { header: 1, defval: "" });

  // 헤더 행 찾기: "1 Depth" 포함된 행
  let headerIdx = rows.findIndex((r) =>
    r.some((c) => String(c).trim() === "1 Depth")
  );
  if (headerIdx === -1) {
    // 대안: Priority, Expected Result 포함 행
    headerIdx = rows.findIndex((r) =>
      r.some((c) => String(c).includes("Priority")) &&
      r.some((c) => String(c).includes("Expected"))
    );
  }
  if (headerIdx === -1) return [];

  const header = rows[headerIdx].map((c) => String(c).trim());

  // 컬럼 인덱스 매핑
  const depthCols = [];
  for (let i = 0; i < header.length; i++) {
    if (/^\d+ Depth$/.test(header[i])) depthCols.push(i);
  }
  const priIdx = header.findIndex((h) => h === "Priority");
  const expIdx = header.findIndex((h) => h.includes("Expected"));

  if (depthCols.length === 0 || expIdx === -1) return [];

  const testCases = [];
  let currentGroup = "";

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => !String(c).trim())) continue;

    // 첫 번째 depth 컬럼에 값이 있으면 그룹(기능영역) 업데이트
    const d1 = String(row[depthCols[0]] || "").trim();
    if (d1) currentGroup = d1;

    // Expected Result가 있으면 테스트 케이스로 취급
    const expected = String(row[expIdx] || "").trim();
    if (!expected) continue;

    // depth 값들을 조합해서 제목 생성
    const depths = depthCols.map((ci) => String(row[ci] || "").trim()).filter(Boolean);
    const title = depths.length > 1 ? depths.slice(1).join(" > ") : depths[0] || "";
    if (!title) continue;

    const priority = priIdx >= 0 ? String(row[priIdx] || "").trim() : "";

    testCases.push({
      title,
      featureArea: currentGroup,
      preconditions: "",
      steps: [{ order: 1, action: title, expected }],
      tags: priority ? [priority] : [],
      linkedItemIds: [],
    });
  }

  return testCases;
}

export default function TestCaseList() {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState(null);
  const [runTarget, setRunTarget] = useState(null);
  const [selected, setSelected] = useState(null);
  const [q, setQ] = useState("");
  const [fArea, setFArea] = useState("all");
  const fileRef = useRef(null);

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const cases = parseExcel(reader.result);
      if (cases.length === 0) {
        alert("테스트 케이스를 찾을 수 없습니다. 엑셀 형식을 확인해주세요.");
        return;
      }
      // 새 기능영역 자동 추가
      const existingAreas = new Set(state.featureAreas);
      const newAreas = [...new Set(cases.map((c) => c.featureArea).filter((a) => a && !existingAreas.has(a)))];
      if (newAreas.length > 0) {
        dispatch({ type: "SET_FEATURE_AREAS", areas: [...state.featureAreas, ...newAreas] });
      }
      cases.forEach((tc) => {
        dispatch({ type: "UPSERT_TEST_CASE", testCase: tc });
      });
      alert(`${cases.length}개의 테스트 케이스를 가져왔습니다.`);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

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
          <div style={{ display: "flex", gap: 6 }}>
            <button className="btn-clear" onClick={() => fileRef.current?.click()}>
              <Upload size={14} /> 엑셀 가져오기
            </button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleImport} style={{ display: "none" }} />
            <button className="btn-primary" onClick={() => setEditing("new")}><Plus size={14} /> 추가</button>
          </div>
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
