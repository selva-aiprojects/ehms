interface BadgeProps {
  children: React.ReactNode;
  variant?: "teal" | "amber" | "red" | "gray" | "navy";
  className?: string;
}

const variants: Record<string, { bg: string; text: string }> = {
  teal:  { bg: "rgba(var(--color-primary-rgb), 0.12)", text: "var(--color-primary)" },
  amber: { bg: "rgba(var(--color-warning-rgb), 0.12)", text: "var(--color-warning)" },
  red:   { bg: "rgba(var(--color-danger-rgb), 0.10)",  text: "var(--color-danger)" },
  gray:  { bg: "var(--color-light)",                   text: "var(--color-text-muted)" },
  navy:  { bg: "rgba(var(--color-navy-rgb), 0.10)",    text: "var(--color-navy)" },
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
