import { Plus, RefreshCw } from "lucide-react";

export default function Header({ saving, onRefresh, onAdd }) {
  return (
    <header className="hdr">
      <div className="hdr-brand">
        <div className="hdr-sub">Tracker</div>
      </div>
      <div className="hdr-actions">
        <button className="btn-ghost" onClick={onRefresh} title="새로고침">
          <RefreshCw size={15} className={saving ? "spin" : ""} />
        </button>
        <button className="btn-primary" onClick={onAdd}>
          <Plus size={16} /> 항목 추가
        </button>
      </div>
    </header>
  );
}
