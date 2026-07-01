import { useState } from "react";
import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeft } from "lucide-react";
import { NAV_SECTIONS } from "../../constants/navigation";
import "./Sidebar.css";

export default function Sidebar({ activeView, onViewChange, collapsed, onToggle }) {
  const [openSections, setOpenSections] = useState(() =>
    Object.fromEntries(NAV_SECTIONS.map((s) => [s.id, true]))
  );

  const toggle = (id) => setOpenSections((p) => ({ ...p, [id]: !p[id] }));

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sb-header">
        {!collapsed && (
          <div className="sb-brand">
            <div className="sb-logo">QA<span>/</span>PM</div>
          </div>
        )}
        <button className="btn-ghost sb-toggle" onClick={onToggle}>
          {collapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      {!collapsed && (
        <nav className="sb-nav">
          {NAV_SECTIONS.map((section) => (
            <div key={section.id} className="sb-section">
              <button className="sb-section-hd" onClick={() => toggle(section.id)}>
                {openSections[section.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                <span>{section.label}</span>
              </button>
              {openSections[section.id] && (
                <div className="sb-items">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      className={`sb-item ${activeView === item.id ? "active" : ""}`}
                      onClick={() => onViewChange(item.id)}
                    >
                      <item.Icon size={15} />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      )}
    </aside>
  );
}
