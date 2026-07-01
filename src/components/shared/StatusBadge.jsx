import { STATUSES } from "../../constants/types";

export default function StatusBadge({ s }) {
  const st = STATUSES[s];
  return <span className="sbadge" style={{ color: st.color, background: st.color + "1c" }}>{st.label}</span>;
}
