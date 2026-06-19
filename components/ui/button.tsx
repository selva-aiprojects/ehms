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
    primary:   { background: "linear-gradient(135deg, #2BAE8E 0%, #4DB88A 100%)", color: "#FFFFFF" },
    secondary: { background: "#1A3C5E", color: "#FFFFFF" },
    outline:   { background: "transparent", color: "#1A3C5E", border: "1px solid #E2E8F0" },
    ghost:     { background: "transparent", color: "#64748B" },
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
      className={`${base} ${sizes[size]} ${className}`}
      style={{ ...styles[variant], ...style }}
    >
      {children}
    </button>
  );
}
