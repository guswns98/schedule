import { useMemo, useState } from "react";
import { FileText, Copy, Check } from "lucide-react";
import { useStore } from "../../../store/StoreContext";
import { todayISO, fmtShort } from "../../../utils/date";

export default function DailyReport() {
  const { state } = useStore();
  const [copied, setCopied] = useState(false);
  const today = todayISO();

  const report = useMemo(() => {
    const done = state.items.filter((i) => i.status === "done");
    const inProgress = state.items.filter((i) => i.status === "in_progress");
    const review = state.items.filter((i) => i.status === "review");
    const overdue = state.items.filter((i) => i.dueDate && i.dueDate < today && i.status !== "done");
    const dueSoon = state.items.filter((i) => i.dueDate && i.dueDate >= today && i.dueDate <= todayISO() && i.status !== "done");
    const bugs = state.items.filter((i) => i.type === "bug" && i.status !== "done");

    // Test progress
    const totalTC = state.testCases.length;
    const executedTC = state.testCases.filter((tc) =>
      state.testRuns.some((r) => r.testCaseId === tc.id)
    ).length;

    return { done, inProgress, review, overdue, dueSoon, bugs, totalTC, executedTC };
  }, [state.items, state.testCases, state.testRuns, today]);

  const markdown = useMemo(() => {
    const lines = [];
    lines.push(`# 일일 리포트 - ${today}`);
    lines.push("");

    if (report.inProgress.length) {
      lines.push("## 🔄 진행 중");
      report.inProgress.forEach((i) => lines.push(`- [${i.code}] ${i.title} (${i.assignee || "미배정"}) ~${fmtShort(i.dueDate)}`));
      lines.push("");
    }

    if (report.review.length) {
      lines.push("## 👀 검토 대기");
      report.review.forEach((i) => lines.push(`- [${i.code}] ${i.title} (${i.assignee || "미배정"})`));
      lines.push("");
    }

    if (report.done.length) {
      lines.push("## ✅ 완료");
      report.done.forEach((i) => lines.push(`- [${i.code}] ${i.title}`));
      lines.push("");
    }

    if (report.overdue.length) {
      lines.push("## ⚠️ 마감 초과");
      report.overdue.forEach((i) => lines.push(`- [${i.code}] ${i.title} (마감: ${fmtShort(i.dueDate)}) - ${i.assignee || "미배정"}`));
      lines.push("");
    }

    if (report.bugs.length) {
      lines.push("## 🐛 활성 버그");
      report.bugs.forEach((i) => lines.push(`- [${i.code}] ${i.title} (${i.priority}) - ${i.assignee || "미배정"}`));
      lines.push("");
    }

    if (report.totalTC > 0) {
      lines.push("## 📊 테스트 현황");
      lines.push(`- 전체: ${report.totalTC}개 / 실행: ${report.executedTC}개 (${Math.round((report.executedTC / report.totalTC) * 100)}%)`);
      lines.push("");
    }

    return lines.join("\n");
  }, [report, today]);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="tm-title"><FileText size={18} /> 일일 리포트</h2>
        <button className="btn-primary" onClick={copyToClipboard}>
          {copied ? <><Check size={14} /> 복사됨</> : <><Copy size={14} /> 클립보드 복사</>}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
        <div className="rs-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#F59E0B" }}>{report.inProgress.length}</div>
          <div className="muted" style={{ fontSize: 11 }}>진행 중</div>
        </div>
        <div className="rs-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#8B5CF6" }}>{report.review.length}</div>
          <div className="muted" style={{ fontSize: 11 }}>검토 대기</div>
        </div>
        <div className="rs-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#F43F5E" }}>{report.overdue.length}</div>
          <div className="muted" style={{ fontSize: 11 }}>마감 초과</div>
        </div>
        <div className="rs-card" style={{ textAlign: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#F43F5E" }}>{report.bugs.length}</div>
          <div className="muted" style={{ fontSize: 11 }}>활성 버그</div>
        </div>
      </div>

      <div className="rs-card">
        <pre style={{
          fontFamily: "var(--mono)", fontSize: 12.5, lineHeight: 1.7,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
          padding: 16, background: "var(--bg)", borderRadius: 8,
          margin: 0, maxHeight: 500, overflow: "auto",
        }}>
          {markdown}
        </pre>
      </div>
    </div>
  );
}
