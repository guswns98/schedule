export default function Select({ value, onChange, opts, label }) {
  return (
    <label className="sel">
      <span className="sel-lb">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </label>
  );
}
