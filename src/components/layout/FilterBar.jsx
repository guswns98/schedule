import { Search, X } from "lucide-react";
import { TYPES, STATUSES } from "../../constants/types";
import Select from "../shared/Select";

export default function FilterBar({ q, onQ, fType, onFType, fStatus, onFStatus, fAssignee, onFAssignee, assignees, anyFilter, onClear }) {
  return (
    <div className="filters">
      <div className="search">
        <Search size={14} />
        <input
          value={q}
          onChange={(e) => onQ(e.target.value)}
          placeholder="ID · 제목 · 담당자 · 태그 검색"
        />
      </div>
      <Select value={fType} onChange={onFType} label="유형"
        opts={[["all", "전체 유형"], ...Object.entries(TYPES).map(([k, v]) => [k, v.label])]} />
      <Select value={fStatus} onChange={onFStatus} label="상태"
        opts={[["all", "전체 상태"], ...Object.entries(STATUSES).map(([k, v]) => [k, v.label])]} />
      <Select value={fAssignee} onChange={onFAssignee} label="담당"
        opts={[["all", "전체 담당자"], ...assignees.map((a) => [a, a])]} />
      {anyFilter ? <button className="btn-clear" onClick={onClear}><X size={13} /> 초기화</button> : null}
    </div>
  );
}
