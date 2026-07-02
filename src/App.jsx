import { useState, useMemo } from "react";
import { useStore } from "./store/StoreContext";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import FilterBar from "./components/layout/FilterBar";
import Empty from "./components/shared/Empty";
import BoardView from "./components/views/board/BoardView";
import TimelineView from "./components/views/timeline/TimelineView";
import CalendarView from "./components/views/calendar/CalendarView";
import TableView from "./components/views/table/TableView";
import TestCaseList from "./components/views/test-management/TestCaseList";
import TestCoverageMatrix from "./components/views/test-management/TestCoverageMatrix";
import RegressionSets from "./components/views/test-management/RegressionSets";
import BugReproTracker from "./components/views/qa/BugReproTracker";
import DeviceMatrix from "./components/views/qa/DeviceMatrix";
import ReleaseChecklist from "./components/views/qa/ReleaseChecklist";
import DefectDensity from "./components/views/qa/DefectDensity";
import ReleaseCalendar from "./components/views/pm/ReleaseCalendar";
import RiskHeatmap from "./components/views/pm/RiskHeatmap";
import WorkloadView from "./components/views/pm/WorkloadView";
import TestProgress from "./components/views/pm/TestProgress";
import DailyReport from "./components/views/convenience/DailyReport";
import ScreenshotAnnotator from "./components/views/convenience/ScreenshotAnnotator";
import ChecklistTemplates from "./components/views/convenience/ChecklistTemplates";
import ItemForm from "./components/forms/ItemForm";
import "./App.css";

export default function App() {
  const { state, dispatch, refresh, loading } = useStore();
  const [view, setView] = useState("kanban");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [fType, setFType] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fAssignee, setFAssignee] = useState("all");

  const handleRefresh = () => {
    setSaving(true);
    refresh();
    setSaving(false);
  };

  const upsert = (item) => {
    dispatch({ type: "UPSERT_ITEM", item });
    setEditing(null);
  };
  const remove = (id) => {
    dispatch({ type: "REMOVE_ITEM", id });
    setEditing(null);
  };
  const setStatus = (id, status) => {
    dispatch({ type: "SET_STATUS", id, status });
  };

  const items = state?.items || [];

  const assignees = useMemo(
    () => Array.from(new Set(items.map((i) => i.assignee).filter(Boolean))).sort(),
    [items]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return items.filter((i) => {
      if (fType !== "all" && i.type !== fType) return false;
      if (fStatus !== "all" && i.status !== fStatus) return false;
      if (fAssignee !== "all" && i.assignee !== fAssignee) return false;
      if (needle) {
        const hay = `${i.code} ${i.title} ${i.assignee} ${(i.tags || []).join(" ")}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [items, q, fType, fStatus, fAssignee]);

  const anyFilter = fType !== "all" || fStatus !== "all" || fAssignee !== "all" || q.trim();
  const clearFilters = () => { setFType("all"); setFStatus("all"); setFAssignee("all"); setQ(""); };

  const isBoardView = ["kanban", "timeline", "calendar", "table"].includes(view);

  const renderContent = () => {
    if (isBoardView) {
      if (items.length === 0) return <Empty onAdd={() => setEditing("new")} />;
      if (filtered.length === 0) {
        return (
          <div className="center muted">
            조건에 맞는 항목이 없어요. <button className="linkbtn" onClick={clearFilters}>필터 초기화</button>
          </div>
        );
      }
      switch (view) {
        case "kanban":   return <BoardView items={filtered} onOpen={setEditing} onStatus={setStatus} />;
        case "timeline": return <TimelineView items={filtered} onOpen={setEditing} />;
        case "calendar": return <CalendarView items={filtered} onOpen={setEditing} />;
        case "table":    return <TableView items={filtered} onOpen={setEditing} />;
      }
    }

    // Test management views
    switch (view) {
      case "test-cases":
      case "test-runs":
        return <TestCaseList />;
      case "coverage":
        return <TestCoverageMatrix />;
      case "regression":
        return <RegressionSets />;
    }

    // QA views
    switch (view) {
      case "repro-tracker":     return <BugReproTracker />;
      case "device-matrix":     return <DeviceMatrix />;
      case "release-checklist": return <ReleaseChecklist />;
      case "defect-density":    return <DefectDensity />;
    }

    // PM views
    switch (view) {
      case "release-calendar":  return <ReleaseCalendar />;
      case "risk-heatmap":      return <RiskHeatmap />;
      case "workload":          return <WorkloadView />;
      case "test-progress":     return <TestProgress />;
    }

    // Convenience views
    switch (view) {
      case "daily-report":      return <DailyReport />;
      case "screenshot":        return <ScreenshotAnnotator />;
      case "templates":         return <ChecklistTemplates />;
    }

    return null;
  };

  if (loading || !state) {
    return (
      <div className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="muted">불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar
        activeView={view}
        onViewChange={setView}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="app-main">
        <Header saving={saving} onRefresh={handleRefresh} onAdd={() => setEditing("new")} />
        {isBoardView && (
          <FilterBar
            q={q} onQ={setQ}
            fType={fType} onFType={setFType}
            fStatus={fStatus} onFStatus={setFStatus}
            fAssignee={fAssignee} onFAssignee={setFAssignee}
            assignees={assignees}
            anyFilter={anyFilter}
            onClear={clearFilters}
          />
        )}
        <main className="body">
          {renderContent()}
        </main>
      </div>

      {editing ? (
        <ItemForm
          item={editing === "new" ? null : editing}
          onSave={upsert}
          onDelete={remove}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}
