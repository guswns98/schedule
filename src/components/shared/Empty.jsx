import { Plus } from "lucide-react";

export default function Empty({ onAdd }) {
  return (
    <div className="center">
      <div className="empty">
        <div className="empty-title">아직 항목이 없어요</div>
        <p className="muted">태스크·버그·테스트·마일스톤을 한곳에서 추적해 보세요.</p>
        <button className="btn-primary" onClick={onAdd}><Plus size={16} /> 첫 항목 추가</button>
      </div>
    </div>
  );
}
