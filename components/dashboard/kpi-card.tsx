"use client";

import { ReactNode } from "react";

interface KPICardProps {
  title: string;
  value: string;
  change?: string;
  changeDirection?: "up" | "down";
  icon: ReactNode;
  subtitle?: string;
}

export default function KPICard({ title, value, change, changeDirection = "up", icon, subtitle }: KPICardProps) {
  return (
    <div
      className="rounded-xl p-5 text-white relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1A3C5E 0%, #2C3547 100%)" }}
    >
      {/* Subtle teal glow in corner */}
      <div
        className="absolute -top-4 -right-4 w-20 h-20 rounded-full pointer-events-none"
        style={{ background: "rgba(43,174,142,0.18)" }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.65)" }}>{title}</span>
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(43,174,142,0.25)" }}
          >
            {icon}
          </div>
        </div>
        <div className="text-2xl font-bold mb-1">{value}</div>
        {change && (
          <div className="flex items-center gap-1.5 text-xs">
            <span style={{ color: changeDirection === "up" ? "#4DB88A" : "#F5A623" }}>
              {changeDirection === "up" ? "↑" : "↓"} {change}
            </span>
            {subtitle && <span style={{ color: "rgba(255,255,255,0.45)" }}>vs last month</span>}
          </div>
        )}
      </div>
    </div>
  );
}
