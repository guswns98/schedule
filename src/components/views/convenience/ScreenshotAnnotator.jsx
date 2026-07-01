import { useState, useRef, useEffect } from "react";
import { Image, Square, Type, Undo2, Download, Trash2 } from "lucide-react";

export default function ScreenshotAnnotator() {
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [tool, setTool] = useState("rect"); // rect, text
  const [drawing, setDrawing] = useState(false);
  const [start, setStart] = useState(null);
  const [annotations, setAnnotations] = useState([]);
  const [textInput, setTextInput] = useState("");
  const [textPos, setTextPos] = useState(null);
  const imgRef = useRef(null);

  const handleUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        imgRef.current = img;
        setImage(reader.result);
        setAnnotations([]);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const ctx = canvas.getContext("2d");
    const img = imgRef.current;

    const maxW = canvas.parentElement.clientWidth - 40;
    const scale = Math.min(1, maxW / img.width);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    annotations.forEach((a) => {
      if (a.type === "rect") {
        ctx.strokeStyle = "#F43F5E";
        ctx.lineWidth = 2.5;
        ctx.strokeRect(a.x, a.y, a.w, a.h);
      } else if (a.type === "text") {
        ctx.font = "bold 16px Inter, sans-serif";
        ctx.fillStyle = "#F43F5E";
        ctx.fillText(a.text, a.x, a.y);
      }
    });
  };

  useEffect(() => { draw(); }, [annotations, image]);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onMouseDown = (e) => {
    if (!image) return;
    const pos = getPos(e);
    if (tool === "text") {
      setTextPos(pos);
      return;
    }
    setDrawing(true);
    setStart(pos);
  };

  const onMouseUp = (e) => {
    if (!drawing || !start) return;
    const pos = getPos(e);
    const w = pos.x - start.x;
    const h = pos.y - start.y;
    if (Math.abs(w) > 5 && Math.abs(h) > 5) {
      setAnnotations((prev) => [...prev, { type: "rect", x: start.x, y: start.y, w, h }]);
    }
    setDrawing(false);
    setStart(null);
  };

  const addText = () => {
    if (!textInput.trim() || !textPos) return;
    setAnnotations((prev) => [...prev, { type: "text", x: textPos.x, y: textPos.y, text: textInput.trim() }]);
    setTextInput("");
    setTextPos(null);
  };

  const undo = () => setAnnotations((prev) => prev.slice(0, -1));

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `annotated-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h2 className="tm-title"><Image size={18} /> 스크린샷 주석</h2>
        <div style={{ display: "flex", gap: 6 }}>
          {image && (
            <>
              <button className={`btn-clear ${tool === "rect" ? "active" : ""}`}
                style={tool === "rect" ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}}
                onClick={() => setTool("rect")}><Square size={14} /> 사각형</button>
              <button className={`btn-clear ${tool === "text" ? "active" : ""}`}
                style={tool === "text" ? { borderColor: "var(--accent)", color: "var(--accent)" } : {}}
                onClick={() => setTool("text")}><Type size={14} /> 텍스트</button>
              <button className="btn-ghost" onClick={undo} title="실행 취소"><Undo2 size={15} /></button>
              <button className="btn-ghost" onClick={() => { setImage(null); setAnnotations([]); }} title="삭제"><Trash2 size={15} /></button>
              <button className="btn-primary" onClick={downloadImage}><Download size={14} /> 저장</button>
            </>
          )}
        </div>
      </div>

      {!image ? (
        <div className="rs-card" style={{ textAlign: "center", padding: 60 }}>
          <Image size={48} style={{ color: "var(--muted)", opacity: .3, marginBottom: 12 }} />
          <p className="muted" style={{ marginBottom: 12 }}>스크린샷을 업로드하여 주석을 추가하세요</p>
          <label className="btn-primary" style={{ cursor: "pointer" }}>
            이미지 선택
            <input type="file" accept="image/*" onChange={handleUpload} style={{ display: "none" }} />
          </label>
        </div>
      ) : (
        <div className="rs-card" style={{ padding: 20, position: "relative" }}>
          <canvas
            ref={canvasRef}
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
            style={{ cursor: tool === "text" ? "text" : "crosshair", borderRadius: 8, display: "block", maxWidth: "100%" }}
          />
          {textPos && (
            <div style={{ position: "absolute", left: textPos.x + 20, top: textPos.y + 60, display: "flex", gap: 4 }}>
              <input autoFocus value={textInput} onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addText()}
                placeholder="텍스트 입력" style={{ border: "2px solid var(--accent)", borderRadius: 6, padding: "4px 8px", fontSize: 13, fontFamily: "inherit" }} />
              <button className="btn-primary" style={{ padding: "4px 8px", fontSize: 12 }} onClick={addText}>확인</button>
              <button className="btn-ghost" style={{ padding: "4px 6px" }} onClick={() => setTextPos(null)}>취소</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
