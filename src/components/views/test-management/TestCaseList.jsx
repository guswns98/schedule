import { useState, useMemo, useRef } from "react";
import { Plus, Search, FlaskConical, ChevronRight, ChevronDown, CheckCircle2, XCircle, MinusCircle, Upload, FolderOpen, Folder, Trash2, FolderEdit } from "lucide-react";
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
  // 셀 병합 처리: 병합된 영역의 빈 셀에 원본 값 채우기
  if (ws["!merges"]) {
    for (const merge of ws["!merges"]) {
      const origin = ws[utils.encode_cell({ r: merge.s.r, c: merge.s.c })];
      if (!origin) continue;
      for (let r = merge.s.r; r <= merge.e.r; r++) {
        for (let c = merge.s.c; c <= merge.e.c; c++) {
          const addr = utils.encode_cell({ r, c });
          if (!ws[addr]) ws[addr] = { ...origin };
        }
      }
    }
  }
  const rows = utils.sheet_to_json(ws, { header: 1, defval: "" });

  // 헤더 행 찾기: "1 Depth" 포함된 행
  let headerIdx = rows.findIndex((r) =>
    r.some((c) => String(c).trim() === "1 Depth")
  );
  if (headerIdx === -1) {
    headerIdx = rows.findIndex((r) =>
      r.some((c) => String(c).includes("Priority")) &&
      r.some((c) => String(c).includes("Expected"))
    );
  }
  if (headerIdx === -1) return [];

  const header = rows[headerIdx].map((c) => String(c).trim());

  const depthCols = [];
  for (let i = 0; i < header.length; i++) {
    if (/^\d+ Depth$/.test(header[i])) depthCols.push(i);
  }
  const priIdx = header.findIndex((h) => h === "Priority");
  const expIdx = header.findIndex((h) => h.includes("Expected"));

  if (depthCols.length === 0 || expIdx === -1) return [];

  // 루트 폴더명 추출: 헤더 행 바로 위에서 첫 번째 셀에 값이 있는 행
  let rootName = "";
  for (let i = headerIdx - 1; i >= 0; i--) {
    const val = String(rows[i]?.[0] || "").trim();
    if (val && !/Depth|Priority|Expected/i.test(val)) {
      rootName = val;
      break;
    }
  }

  const testCases = [];
  // 각 depth별 현재 값을 추적
  const currentDepths = depthCols.map(() => "");

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((c) => !String(c).trim())) continue;

    // depth 값 업데이트 (상위 depth가 바뀌면 하위는 초기화)
    for (let d = 0; d < depthCols.length; d++) {
      const val = String(row[depthCols[d]] || "").trim();
      if (val) {
        currentDepths[d] = val;
        // 하위 depth 초기화
        for (let k = d + 1; k < depthCols.length; k++) currentDepths[k] = "";
      }
    }

    const expected = String(row[expIdx] || "").trim();
    if (!expected) continue;

    // 마지막 비어있지 않은 depth가 제목, 나머지가 폴더 경로
    const activeParts = currentDepths.filter(Boolean);
    if (activeParts.length === 0) continue;

    const title = activeParts[activeParts.length - 1];
    const folderParts = activeParts.length > 1 ? activeParts.slice(0, -1) : [];
    if (rootName) folderParts.unshift(rootName);
    if (folderParts.length > 2) folderParts.length = 2;
    const folder = folderParts.join(" / ");
    const featureArea = currentDepths[0] || "";

    const priority = priIdx >= 0 ? String(row[priIdx] || "").trim() : "";

    testCases.push({
      title,
      folder,
      featureArea,
      preconditions: "",
      steps: [{ order: 1, action: activeParts.join(" > "), expected }],
      tags: priority ? [priority] : [],
      linkedItemIds: [],
    });
  }

  return testCases;
}

function FolderTreeNode({ node, depth, path, openFolders, toggleFolder, checked, toggleCheck, toggleCheckFolder, getAllCasesInNode, selected, setSelected, getLastRun, getRunCount, resultIcon }) {
  const entries = Object.entries(node.children);
  const paddingLeft = 12 + depth * 16;

  return (
    <>
      {entries.map(([name, child]) => {
        const fullPath = path ? `${path} / ${name}` : name;
        const isOpen = !!openFolders[fullPath];
        const allCases = getAllCasesInNode(child);
        const totalCount = allCases.length;

        return (
          <div key={fullPath}>
            <div className="tm-folder" style={{ paddingLeft }} onClick={() => toggleFolder(fullPath)}>
              <input type="checkbox"
                checked={totalCount > 0 && allCases.every((tc) => checked.has(tc.id))}
                onChange={(e) => toggleCheckFolder(allCases, e)} />
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              {isOpen ? <FolderOpen size={14} /> : <Folder size={14} />}
              <span className="tm-folder-name">{name}</span>
              <span className="tm-folder-count">{totalCount}</span>
            </div>
            {isOpen && (
              <>
                <FolderTreeNode
                  node={child}
                  depth={depth + 1}
                  path={fullPath}
                  openFolders={openFolders}
                  toggleFolder={toggleFolder}
                  checked={checked}
                  toggleCheck={toggleCheck}
                  toggleCheckFolder={toggleCheckFolder}
                  getAllCasesInNode={getAllCasesInNode}
                  selected={selected}
                  setSelected={setSelected}
                  getLastRun={getLastRun}
                  getRunCount={getRunCount}
                  resultIcon={resultIcon}
                />
                {child.cases.map((tc) => {
                  const last = getLastRun(tc.id);
                  const count = getRunCount(tc.id);
                  return (
                    <div key={tc.id}
                      className={`tm-item ${selected === tc.id ? "active" : ""}`}
                      style={{ paddingLeft: paddingLeft + 20 }}
                      onClick={() => setSelected(tc.id)}>
                      <div className="tm-item-top">
                        <input type="checkbox" checked={checked.has(tc.id)}
                          onChange={(e) => toggleCheck(tc.id, e)} />
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
              </>
            )}
          </div>
        );
      })}
      {/* 폴더 없는 루트 레벨 TC */}
      {depth === 0 && node.cases.map((tc) => {
        const last = getLastRun(tc.id);
        const count = getRunCount(tc.id);
        return (
          <div key={tc.id}
            className={`tm-item ${selected === tc.id ? "active" : ""}`}
            onClick={() => setSelected(tc.id)}>
            <div className="tm-item-top">
              <input type="checkbox" checked={checked.has(tc.id)}
                onChange={(e) => toggleCheck(tc.id, e)} />
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
    </>
  );
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
      // 중복 체크: 제목 + 폴더가 같으면 중복
      const existingKeys = new Set(
        state.testCases.map((tc) => `${tc.folder || ""}::${tc.title}`)
      );
      const unique = [];
      const dupes = [];
      for (const tc of cases) {
        const key = `${tc.folder || ""}::${tc.title}`;
        if (existingKeys.has(key)) {
          dupes.push(tc.title);
        } else {
          unique.push(tc);
          existingKeys.add(key);
        }
      }

      if (unique.length === 0) {
        alert(`모든 테스트 케이스(${dupes.length}개)가 이미 존재합니다.`);
        return;
      }

      // 새 기능영역 자동 추가
      const existingAreas = new Set(state.featureAreas);
      const newAreas = [...new Set(unique.map((c) => c.featureArea).filter((a) => a && !existingAreas.has(a)))];
      if (newAreas.length > 0) {
        dispatch({ type: "SET_FEATURE_AREAS", areas: [...state.featureAreas, ...newAreas] });
      }
      unique.forEach((tc) => {
        dispatch({ type: "UPSERT_TEST_CASE", testCase: tc });
      });
      const msg = dupes.length > 0
        ? `${unique.length}개 추가, ${dupes.length}개 중복 건너뜀`
        : `${unique.length}개의 테스트 케이스를 가져왔습니다.`;
      alert(msg);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const [openFolders, setOpenFolders] = useState({});
  const [checked, setChecked] = useState(new Set());

  const toggleFolder = (path) => {
    setOpenFolders((p) => ({ ...p, [path]: !p[path] }));
  };

  const toggleCheck = (id, e) => {
    e.stopPropagation();
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCheckAll = () => {
    if (checked.size === filtered.length) {
      setChecked(new Set());
    } else {
      setChecked(new Set(filtered.map((tc) => tc.id)));
    }
  };

  const toggleCheckFolder = (cases, e) => {
    e.stopPropagation();
    const ids = cases.map((tc) => tc.id);
    setChecked((prev) => {
      const next = new Set(prev);
      const allChecked = ids.every((id) => next.has(id));
      if (allChecked) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const bulkDelete = () => {
    if (checked.size === 0) return;
    if (!confirm(`${checked.size}개의 테스트 케이스를 삭제하시겠습니까?`)) return;
    for (const id of checked) {
      dispatch({ type: "REMOVE_TEST_CASE", id });
    }
    setChecked(new Set());
    setSelected(null);
  };

  const bulkMove = () => {
    if (checked.size === 0) return;
    const folder = prompt("이동할 폴더 경로를 입력하세요 (비우면 루트)");
    if (folder === null) return;
    for (const id of checked) {
      const tc = state.testCases.find((t) => t.id === id);
      if (tc) dispatch({ type: "UPSERT_TEST_CASE", testCase: { ...tc, folder: folder.trim() } });
    }
    setChecked(new Set());
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return state.testCases.filter((tc) => {
      if (fArea !== "all" && tc.featureArea !== fArea) return false;
      if (needle && !`${tc.title} ${tc.folder || ""} ${(tc.tags || []).join(" ")}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [state.testCases, q, fArea]);

  // 폴더 트리 구조 생성
  const folderTree = useMemo(() => {
    const root = { children: {}, cases: [] };
    for (const tc of filtered) {
      const folder = tc.folder || "";
      if (!folder) {
        root.cases.push(tc);
      } else {
        const parts = folder.split(" / ");
        let node = root;
        for (const part of parts) {
          if (!node.children[part]) node.children[part] = { children: {}, cases: [] };
          node = node.children[part];
        }
        node.cases.push(tc);
      }
    }
    return root;
  }, [filtered]);

  // 폴더 내 모든 TC를 재귀적으로 수집
  const getAllCasesInNode = (node) => {
    let all = [...node.cases];
    for (const child of Object.values(node.children)) {
      all = all.concat(getAllCasesInNode(child));
    }
    return all;
  };

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

        {filtered.length > 0 && (
          <div className="tm-bulk-bar">
            <label className="tm-check-wrap" onClick={(e) => e.stopPropagation()}>
              <input type="checkbox" checked={checked.size === filtered.length && filtered.length > 0}
                onChange={toggleCheckAll} />
              <span className="tm-bulk-label">
                {checked.size > 0 ? `${checked.size}개 선택` : "전체 선택"}
              </span>
            </label>
            {checked.size > 0 && (
              <div style={{ display: "flex", gap: 4 }}>
                <button className="btn-ghost" style={{ fontSize: 12, padding: "3px 8px" }} onClick={bulkMove}>
                  <FolderEdit size={13} /> 이동
                </button>
                <button className="btn-danger" style={{ fontSize: 12, padding: "3px 8px" }} onClick={bulkDelete}>
                  <Trash2 size={13} /> 삭제
                </button>
              </div>
            )}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="tm-empty">
            <p className="muted">테스트 케이스가 없습니다.</p>
            <button className="btn-primary" onClick={() => setEditing("new")}><Plus size={14} /> 첫 테스트 케이스 추가</button>
          </div>
        ) : (
          <div className="tm-items">
            <FolderTreeNode
              node={folderTree}
              depth={0}
              path=""
              openFolders={openFolders}
              toggleFolder={toggleFolder}
              checked={checked}
              toggleCheck={toggleCheck}
              toggleCheckFolder={toggleCheckFolder}
              getAllCasesInNode={getAllCasesInNode}
              selected={selected}
              setSelected={setSelected}
              getLastRun={getLastRun}
              getRunCount={getRunCount}
              resultIcon={resultIcon}
            />
          </div>
        )}
      </div>

      <div className="tm-detail">
        {detail ? (
          <>
            <div className="tm-detail-hd">
              <div>
                <span className="tm-item-area">{detail.featureArea}</span>
                {detail.folder && (
                  <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
                    <Folder size={12} /> {detail.folder}
                  </div>
                )}
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
