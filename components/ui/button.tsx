import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md";
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}

export default function Button({
  children, variant = "primary", size = "md", className = "", style,
  onClick, type = "button", disabled,
}: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all cursor-pointer disabled:opacity-50";

  const styles: Record<string, React.CSSProperties> = {
    primary:   { background: "var(--hs-navy)", color: "var(--hs-surface-white)" },
    secondary: { background: "var(--hs-gold)", color: "var(--hs-navy)" },
    outline:   { background: "transparent", color: "var(--hs-navy)", border: "1px solid var(--hs-gold)" },
    ghost:     { background: "transparent", color: "var(--hs-text-muted)" },
  };

  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} hs-btn ${variant === "primary" ? "hs-btn-primary" : ""} ${variant === "secondary" ? "hs-btn-secondary" : ""} ${sizes[size]} ${className}`}
      style={{ ...styles[variant], ...style }}
    >
      {children}
    </button>
  );
}
