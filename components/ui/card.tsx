import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  padding?: boolean;
}

export default function Card({ children, className = "", style, padding = true }: CardProps) {
  return (
    <div
      className={`rounded-xl bg-white ${padding ? "p-5" : ""} ${className}`}
      style={{ border: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(26,60,94,0.06)", ...style }}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-base font-semibold" style={{ color: "#1A3C5E" }}>{title}</h3>
        {subtitle && <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
