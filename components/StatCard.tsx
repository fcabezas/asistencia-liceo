import Link from "next/link";

const ACCENT_CLASSES: Record<string, string> = {
  brand: "border-l-brand-500",
  gold: "border-l-gold-500",
  red: "border-l-red-600",
  green: "border-l-green-600",
};

export default function StatCard({
  label,
  value,
  accent = "brand",
  href,
}: {
  label: string;
  value: string | number;
  accent?: "brand" | "gold" | "red" | "green";
  href?: string;
}) {
  const card = (
    <div
      className={`rounded-xl border border-zinc-200 border-l-4 ${ACCENT_CLASSES[accent]} bg-white p-4 shadow-sm ${
        href ? "transition-shadow hover:shadow-md" : ""
      }`}
    >
      <p className="text-2xl font-bold text-brand-900">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{label}</p>
    </div>
  );

  return href ? <Link href={href}>{card}</Link> : card;
}
