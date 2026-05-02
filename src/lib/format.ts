export const formatRWF = (n: number | null | undefined) => {
  const v = Number(n ?? 0);
  return new Intl.NumberFormat("en-US").format(Math.round(v)) + " RWF";
};

export const formatNumber = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-US").format(Number(n ?? 0));

export const formatDate = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const formatDateTime = (d: string | Date | null | undefined) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const normalizeName = (s: string) =>
  s.trim().toLowerCase().replace(/\s+/g, " ");

export const normalizeRwandaPhone = (raw: string): string | null => {
  if (!raw) return null;
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+250") && digits.length === 13) return digits;
  if (digits.startsWith("250") && digits.length === 12) return "+" + digits;
  if (digits.startsWith("07") && digits.length === 10) return "+250" + digits.slice(1);
  if (digits.startsWith("7") && digits.length === 9) return "+250" + digits;
  return null;
};