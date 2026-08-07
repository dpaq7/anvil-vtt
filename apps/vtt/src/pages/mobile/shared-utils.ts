import { cn } from "@anvil/ui";

export function mobileContainerClass(className?: string) {
  return cn(
    "mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-4",
    className,
  );
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "No date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatBytes(value: number | null | undefined): string {
  if (!value || value <= 0) return "Size unknown";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function titleCase(value: string | null | undefined): string {
  if (!value) return "None";
  return value
    .replace(/[_-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function parseList(value: string | null | undefined): string[] {
  const parsed = parseJson<unknown>(value, null);
  if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
  if (typeof parsed === "string") {
    return parsed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}
