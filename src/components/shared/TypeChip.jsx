import { TYPES } from "../../constants/types";

export default function TypeChip({ type }) {
  const t = TYPES[type];
  return (
    <span className="tchip" style={{ color: t.color, background: t.color + "18" }}>
      <t.Icon size={11} /> {t.label}
    </span>
  );
}
