import { useState, useRef } from "react";
import { STATUS_ORDER, STATUSES } from "../../../constants/types";
import Card from "../../shared/Card";

export default function BoardView({ items, onOpen, onStatus }) {
  const [over, setOver] = useState(null);
  const dragId = useRef(null);

  return (
    <div className="board">
      {STATUS_ORDER.map((s) => {
        const col = items.filter((i) => i.status === s);
        const st = STATUSES[s];
        return (
          <div
            key={s}
            className={`col ${over === s ? "over" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setOver(s); }}
            onDragLeave={() => setOver((o) => (o === s ? null : o))}
            onDrop={() => { if (dragId.current) onStatus(dragId.current, s); dragId.current = null; setOver(null); }}
          >
            <div className="col-hd">
              <span className="dot" style={{ background: st.color }} />
              {st.label}
              <span className="col-n">{col.length}</span>
            </div>
            <div className="col-body">
              {col.map((i) => (
                <Card key={i.id} item={i} onOpen={onOpen} draggable
                  onDragStart={() => (dragId.current = i.id)} />
              ))}
              {col.length === 0 ? <div className="col-empty">비어 있음</div> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
