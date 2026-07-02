import { useState } from "react";
import { Lock } from "lucide-react";

const PASS = import.meta.env.VITE_APP_PASSWORD;

export default function AuthGate({ children }) {
  const [authed, setAuthed] = useState(() => {
    if (!PASS) return true;
    return sessionStorage.getItem("authed") === "1";
  });
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (input === PASS) {
      sessionStorage.setItem("authed", "1");
      setAuthed(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 1500);
    }
  };

  if (authed) return children;

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      height: "100vh", background: "var(--bg)",
    }}>
      <form onSubmit={submit} style={{
        background: "var(--surface)", border: "1px solid var(--line)",
        borderRadius: 12, padding: "32px 28px", width: 320,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      }}>
        <Lock size={28} style={{ color: "var(--accent)" }} />
        <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>Tracker</h2>
        <input
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="비밀번호를 입력하세요"
          autoFocus
          style={{
            width: "100%", padding: "10px 12px", border: `1px solid ${error ? "#DC2626" : "var(--line)"}`,
            borderRadius: 8, fontSize: 14, fontFamily: "inherit", outline: "none",
            transition: "border-color .2s",
          }}
        />
        {error && <span style={{ color: "#DC2626", fontSize: 13 }}>비밀번호가 틀렸습니다</span>}
        <button type="submit" className="btn-primary" style={{ width: "100%" }}>
          입장
        </button>
      </form>
    </div>
  );
}
