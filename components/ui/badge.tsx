interface BadgeProps {
  children: React.ReactNode;
  variant?: "teal" | "amber" | "red" | "gray" | "navy";
  className?: string;
}

const variants: Record<string, { bg: string; text: string }> = {
  teal:  { bg: "rgba(43,174,142,0.12)", text: "#2BAE8E" },
  amber: { bg: "rgba(245,166,35,0.12)",  text: "#D4850A" },
  red:   { bg: "rgba(229,62,62,0.10)",   text: "#C53030" },
  gray:  { bg: "#F5F7FA",                text: "#64748B" },
  navy:  { bg: "rgba(26,60,94,0.10)",    text: "#1A3C5E" },
};

export default function Badge({ children, variant = "gray", className = "" }: BadgeProps) {
  const v = variants[variant] || variants.gray;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold leading-4 ${className}`}
      style={{ background: v.bg, color: v.text }}
    >
      {children}
    </span>
  );
}
