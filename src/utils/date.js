export const pad = (n) => String(n).padStart(2, "0");

export const toISO = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const parseISO = (s) => {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const todayISO = () => toISO(new Date());

export const fmtShort = (s) => {
  const d = parseISO(s);
  return d ? `${d.getMonth() + 1}/${d.getDate()}` : "—";
};

export const daysBetween = (a, b) => Math.round((b - a) / 86400000);

export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
